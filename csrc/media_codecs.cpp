#include "media_codecs.hpp"
#include "anime_palette_synth.hpp"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <fstream>

namespace sakuga {

namespace {

// ==================== BitWriter for H.264 RBSP ====================
struct BitWriter {
    std::vector<uint8_t> buf;
    uint8_t cur = 0;
    int bit_pos = 0; // 0..7 from MSB to LSB

    void put_bit(int b) {
        cur = static_cast<uint8_t>((cur << 1) | (b & 1));
        bit_pos++;
        if (bit_pos == 8) {
            buf.push_back(cur);
            cur = 0;
            bit_pos = 0;
        }
    }

    void put_bits(uint32_t val, int n) {
        for (int i = n - 1; i >= 0; --i) {
            put_bit((val >> i) & 1);
        }
    }

    // Unsigned Exp-Golomb ue(v)
    void put_ue(uint32_t val) {
        uint32_t code = val + 1;
        int len = 0;
        uint32_t tmp = code;
        while (tmp > 0) { len++; tmp >>= 1; }
        for (int i = 0; i < len - 1; ++i) put_bit(0);
        put_bits(code, len);
    }

    // Signed Exp-Golomb se(v)
    void put_se(int32_t val) {
        uint32_t code_num = (val <= 0)
            ? static_cast<uint32_t>(-2 * val)
            : static_cast<uint32_t>(2 * val - 1);
        put_ue(code_num);
    }

    void byte_align_zero() {
        while (bit_pos != 0) put_bit(0);
    }

    void rbsp_trailing_bits() {
        put_bit(1);
        byte_align_zero();
    }

    void put_raw_byte(uint8_t b) {
        // Must be byte-aligned when called
        buf.push_back(b);
    }
};

// Wrap NAL header + RBSP into EBSP with H.264 0x03 emulation prevention bytes
std::vector<uint8_t> rbsp_to_ebsp(uint8_t nal_header, const std::vector<uint8_t>& rbsp) {
    std::vector<uint8_t> out;
    out.reserve(rbsp.size() + rbsp.size() / 64 + 8);
    out.push_back(nal_header);
    int zero_run = 0;
    for (uint8_t b : rbsp) {
        if (zero_run >= 2 && b <= 0x03) {
            out.push_back(0x03);
            zero_run = 0;
        }
        out.push_back(b);
        if (b == 0x00) zero_run++;
        else zero_run = 0;
    }
    return out;
}

// ==================== Big-Endian Box Builder for ISO-BMFF (.mp4) ====================
struct BoxBuf {
    std::vector<uint8_t> d;

    void u8(uint8_t v) { d.push_back(v); }
    void u16(uint16_t v) {
        d.push_back(static_cast<uint8_t>((v >> 8) & 0xFF));
        d.push_back(static_cast<uint8_t>(v & 0xFF));
    }
    void u24(uint32_t v) {
        d.push_back(static_cast<uint8_t>((v >> 16) & 0xFF));
        d.push_back(static_cast<uint8_t>((v >> 8) & 0xFF));
        d.push_back(static_cast<uint8_t>(v & 0xFF));
    }
    void u32(uint32_t v) {
        d.push_back(static_cast<uint8_t>((v >> 24) & 0xFF));
        d.push_back(static_cast<uint8_t>((v >> 16) & 0xFF));
        d.push_back(static_cast<uint8_t>((v >> 8) & 0xFF));
        d.push_back(static_cast<uint8_t>(v & 0xFF));
    }
    void fourcc(const char s[4]) {
        d.insert(d.end(), s, s + 4);
    }
    void zeros(size_t n) {
        d.insert(d.end(), n, 0);
    }
    void bytes(const uint8_t* p, size_t n) {
        d.insert(d.end(), p, p + n);
    }
    void append(const BoxBuf& other) {
        d.insert(d.end(), other.d.begin(), other.d.end());
    }
};

BoxBuf make_box(const char type[4], const BoxBuf& payload) {
    BoxBuf b;
    b.u32(static_cast<uint32_t>(8 + payload.d.size()));
    b.fourcc(type);
    b.append(payload);
    return b;
}

static inline void rgb_to_bt601(uint8_t r, uint8_t g, uint8_t b, uint8_t& y, uint8_t& cb, uint8_t& cr) {
    int yi  = (( 66 * r + 129 * g +  25 * b + 128) >> 8) + 16;
    int cbi = ((-38 * r -  74 * g + 112 * b + 128) >> 8) + 128;
    int cri = ((112 * r -  94 * g -  18 * b + 128) >> 8) + 128;
    y  = static_cast<uint8_t>(std::clamp(yi,  16, 235));
    cb = static_cast<uint8_t>(std::clamp(cbi, 16, 240));
    cr = static_cast<uint8_t>(std::clamp(cri, 16, 240));
}

} // namespace

bool write_mp4_h264(
    const std::string& path,
    const uint8_t* rgb_frames,
    int num_frames,
    int width,
    int height,
    int fps
) {
    if (width % 16 != 0 || height % 16 != 0 || num_frames <= 0) return false;
    int mb_w = width / 16;
    int mb_h = height / 16;

    // 1. Build SPS (Baseline Profile 66, Level 3.0)
    BitWriter sps_bw;
    sps_bw.put_bits(66, 8);     // profile_idc = 66 (Baseline)
    sps_bw.put_bits(0x80, 8);   // constraint_set0_flag = 1
    sps_bw.put_bits(30, 8);     // level_idc = 30
    sps_bw.put_ue(0);           // seq_parameter_set_id = 0
    sps_bw.put_ue(4);           // log2_max_frame_num_minus4 = 4 (8-bit frame_num)
    sps_bw.put_ue(2);           // pic_order_cnt_type = 2
    sps_bw.put_ue(0);           // max_num_ref_frames = 0 (all IDR)
    sps_bw.put_bit(0);          // gaps_in_frame_num_value_allowed_flag = 0
    sps_bw.put_ue(static_cast<uint32_t>(mb_w - 1));
    sps_bw.put_ue(static_cast<uint32_t>(mb_h - 1));
    sps_bw.put_bit(1);          // frame_mbs_only_flag = 1
    sps_bw.put_bit(1);          // direct_8x8_inference_flag = 1
    sps_bw.put_bit(0);          // frame_cropping_flag = 0
    sps_bw.put_bit(0);          // vui_parameters_present_flag = 0
    sps_bw.rbsp_trailing_bits();
    std::vector<uint8_t> sps_nal = rbsp_to_ebsp(0x67, sps_bw.buf);

    // 2. Build PPS
    BitWriter pps_bw;
    pps_bw.put_ue(0);           // pic_parameter_set_id = 0
    pps_bw.put_ue(0);           // seq_parameter_set_id = 0
    pps_bw.put_bit(0);          // entropy_coding_mode_flag = 0 (CAVLC)
    pps_bw.put_bit(0);          // bottom_field_pic_order_in_frame_present_flag = 0
    pps_bw.put_ue(0);           // num_slice_groups_minus1 = 0
    pps_bw.put_ue(0);           // num_ref_idx_l0_default_active_minus1 = 0
    pps_bw.put_ue(0);           // num_ref_idx_l1_default_active_minus1 = 0
    pps_bw.put_bit(0);          // weighted_pred_flag = 0
    pps_bw.put_bits(0, 2);      // weighted_bipred_idc = 0
    pps_bw.put_se(0);           // pic_init_qp_minus26 = 0
    pps_bw.put_se(0);           // pic_init_qs_minus26 = 0
    pps_bw.put_se(0);           // chroma_qp_index_offset = 0
    pps_bw.put_bit(1);          // deblocking_filter_control_present_flag = 1
    pps_bw.put_bit(0);          // constrained_intra_pred_flag = 0
    pps_bw.put_bit(0);          // redundant_pic_cnt_present_flag = 0
    pps_bw.rbsp_trailing_bits();
    std::vector<uint8_t> pps_nal = rbsp_to_ebsp(0x68, pps_bw.buf);

    // 3. Build ftyp box
    BoxBuf ftyp_p;
    ftyp_p.fourcc("isom");
    ftyp_p.u32(0x00000200);
    ftyp_p.fourcc("isom");
    ftyp_p.fourcc("iso2");
    ftyp_p.fourcc("avc1");
    ftyp_p.fourcc("mp41");
    BoxBuf ftyp = make_box("ftyp", ftyp_p);

    // 4. Encode all frames as IDR slices with I_PCM macroblocks inside mdat
    BoxBuf mdat_p;
    std::vector<uint32_t> sample_sizes(num_frames);
    std::vector<uint32_t> sample_offsets(num_frames);

    uint32_t mdat_data_start = static_cast<uint32_t>(ftyp.d.size() + 8); // after 8-byte mdat header

    for (int f = 0; f < num_frames; ++f) {
        const uint8_t* frame = rgb_frames + static_cast<size_t>(f) * width * height * 3;
        BitWriter sl;
        sl.buf.reserve(static_cast<size_t>(mb_w * mb_h * 390 + 32));

        // Slice Header (IDR nal_unit_type = 5)
        sl.put_ue(0);                              // first_mb_in_slice = 0
        sl.put_ue(7);                              // slice_type = 7 (all-I slice)
        sl.put_ue(0);                              // pic_parameter_set_id = 0
        sl.put_bits(0, 8);                         // frame_num = 0
        sl.put_ue(static_cast<uint32_t>(f & 1));   // idr_pic_id alternates 0, 1
        sl.put_bit(0);                             // no_output_of_prior_pics_flag = 0
        sl.put_bit(0);                             // long_term_reference_flag = 0
        sl.put_se(0);                              // slice_qp_delta = 0
        sl.put_ue(1);                              // disable_deblocking_filter_idc = 1 (sharp pixel art!)

        // Slice Data: raster scan of 16x16 I_PCM macroblocks
        for (int my = 0; my < mb_h; ++my) {
            for (int mx = 0; mx < mb_w; ++mx) {
                sl.put_ue(25); // mb_type = 25 (I_PCM)
                sl.byte_align_zero();

                uint8_t y_blk[16][16];
                int cb_acc[8][8] = {};
                int cr_acc[8][8] = {};

                for (int py = 0; py < 16; ++py) {
                    int iy = my * 16 + py;
                    for (int px = 0; px < 16; ++px) {
                        int ix = mx * 16 + px;
                        const uint8_t* p = frame + (iy * width + ix) * 3;
                        uint8_t yv, cbv, crv;
                        rgb_to_bt601(p[0], p[1], p[2], yv, cbv, crv);
                        y_blk[py][px] = yv;
                        cb_acc[py >> 1][px >> 1] += cbv;
                        cr_acc[py >> 1][px >> 1] += crv;
                    }
                }

                for (int py = 0; py < 16; ++py)
                    for (int px = 0; px < 16; ++px)
                        sl.put_raw_byte(y_blk[py][px]);

                for (int cy = 0; cy < 8; ++cy)
                    for (int cx = 0; cx < 8; ++cx)
                        sl.put_raw_byte(static_cast<uint8_t>((cb_acc[cy][cx] + 2) >> 2));

                for (int cy = 0; cy < 8; ++cy)
                    for (int cx = 0; cx < 8; ++cx)
                        sl.put_raw_byte(static_cast<uint8_t>((cr_acc[cy][cx] + 2) >> 2));
            }
        }
        sl.rbsp_trailing_bits();

        std::vector<uint8_t> idr_ebsp = rbsp_to_ebsp(0x65, sl.buf);
        sample_offsets[f] = mdat_data_start + static_cast<uint32_t>(mdat_p.d.size());
        mdat_p.u32(static_cast<uint32_t>(idr_ebsp.size()));
        mdat_p.bytes(idr_ebsp.data(), idr_ebsp.size());
        sample_sizes[f] = static_cast<uint32_t>(4 + idr_ebsp.size());
    }
    BoxBuf mdat = make_box("mdat", mdat_p);

    // 5. Build moov hierarchy
    uint32_t timescale = static_cast<uint32_t>(std::max(1, fps) * 1000);
    uint32_t duration = static_cast<uint32_t>(num_frames * 1000);

    auto write_unity_matrix = [](BoxBuf& b) {
        b.u32(0x00010000); b.u32(0); b.u32(0);
        b.u32(0); b.u32(0x00010000); b.u32(0);
        b.u32(0); b.u32(0); b.u32(0x40000000);
    };

    BoxBuf mvhd_p;
    mvhd_p.u32(0); // version + flags
    mvhd_p.u32(0); mvhd_p.u32(0); // ctime, mtime
    mvhd_p.u32(timescale);
    mvhd_p.u32(duration);
    mvhd_p.u32(0x00010000); // rate 1.0
    mvhd_p.u16(0x0100);     // volume 1.0
    mvhd_p.zeros(10);
    write_unity_matrix(mvhd_p);
    mvhd_p.zeros(24);
    mvhd_p.u32(2); // next_track_ID
    BoxBuf mvhd = make_box("mvhd", mvhd_p);

    BoxBuf tkhd_p;
    tkhd_p.u8(0); tkhd_p.u24(0x000003); // enabled | in_movie
    tkhd_p.u32(0); tkhd_p.u32(0);
    tkhd_p.u32(1); // track_ID = 1
    tkhd_p.u32(0);
    tkhd_p.u32(duration);
    tkhd_p.zeros(8);
    tkhd_p.u16(0); tkhd_p.u16(0);
    tkhd_p.u16(0); tkhd_p.u16(0);
    write_unity_matrix(tkhd_p);
    tkhd_p.u32(static_cast<uint32_t>(width) << 16);
    tkhd_p.u32(static_cast<uint32_t>(height) << 16);
    BoxBuf tkhd = make_box("tkhd", tkhd_p);

    BoxBuf mdhd_p;
    mdhd_p.u32(0);
    mdhd_p.u32(0); mdhd_p.u32(0);
    mdhd_p.u32(timescale);
    mdhd_p.u32(duration);
    mdhd_p.u16(0x55C4); // 'und'
    mdhd_p.u16(0);
    BoxBuf mdhd = make_box("mdhd", mdhd_p);

    BoxBuf hdlr_p;
    hdlr_p.u32(0);
    hdlr_p.u32(0);
    hdlr_p.fourcc("vide");
    hdlr_p.zeros(12);
    const char hname[] = "SakugaH264";
    hdlr_p.bytes(reinterpret_cast<const uint8_t*>(hname), sizeof(hname));
    BoxBuf hdlr = make_box("hdlr", hdlr_p);

    BoxBuf vmhd_p;
    vmhd_p.u8(0); vmhd_p.u24(0x000001);
    vmhd_p.zeros(8);
    BoxBuf vmhd = make_box("vmhd", vmhd_p);

    BoxBuf url_p;
    url_p.u8(0); url_p.u24(0x000001);
    BoxBuf dref_p;
    dref_p.u32(0);
    dref_p.u32(1);
    dref_p.append(make_box("url ", url_p));
    BoxBuf dinf_p;
    dinf_p.append(make_box("dref", dref_p));
    BoxBuf dinf = make_box("dinf", dinf_p);

    // avcC box
    BoxBuf avcC_p;
    avcC_p.u8(1);
    avcC_p.u8(sps_nal[1]);
    avcC_p.u8(sps_nal[2]);
    avcC_p.u8(sps_nal[3]);
    avcC_p.u8(0xFF); // 4-byte NAL length
    avcC_p.u8(0xE1); // 1 SPS
    avcC_p.u16(static_cast<uint16_t>(sps_nal.size()));
    avcC_p.bytes(sps_nal.data(), sps_nal.size());
    avcC_p.u8(1);    // 1 PPS
    avcC_p.u16(static_cast<uint16_t>(pps_nal.size()));
    avcC_p.bytes(pps_nal.data(), pps_nal.size());
    BoxBuf avcC = make_box("avcC", avcC_p);

    BoxBuf avc1_p;
    avc1_p.zeros(6);
    avc1_p.u16(1); // data_reference_index
    avc1_p.zeros(16);
    avc1_p.u16(static_cast<uint16_t>(width));
    avc1_p.u16(static_cast<uint16_t>(height));
    avc1_p.u32(0x00480000);
    avc1_p.u32(0x00480000);
    avc1_p.u32(0);
    avc1_p.u16(1); // frame_count
    avc1_p.zeros(32); // compressorname
    avc1_p.u16(0x0018); // depth = 24
    avc1_p.u16(0xFFFF); // pre_defined = -1
    avc1_p.append(avcC);
    BoxBuf avc1 = make_box("avc1", avc1_p);

    BoxBuf stsd_p;
    stsd_p.u32(0);
    stsd_p.u32(1);
    stsd_p.append(avc1);
    BoxBuf stsd = make_box("stsd", stsd_p);

    BoxBuf stts_p;
    stts_p.u32(0);
    stts_p.u32(1);
    stts_p.u32(static_cast<uint32_t>(num_frames));
    stts_p.u32(1000);
    BoxBuf stts = make_box("stts", stts_p);

    BoxBuf stss_p;
    stss_p.u32(0);
    stss_p.u32(static_cast<uint32_t>(num_frames));
    for (int f = 0; f < num_frames; ++f) stss_p.u32(static_cast<uint32_t>(f + 1));
    BoxBuf stss = make_box("stss", stss_p);

    BoxBuf stsc_p;
    stsc_p.u32(0);
    stsc_p.u32(1);
    stsc_p.u32(1); stsc_p.u32(1); stsc_p.u32(1);
    BoxBuf stsc = make_box("stsc", stsc_p);

    BoxBuf stsz_p;
    stsz_p.u32(0);
    stsz_p.u32(0);
    stsz_p.u32(static_cast<uint32_t>(num_frames));
    for (int f = 0; f < num_frames; ++f) stsz_p.u32(sample_sizes[f]);
    BoxBuf stsz = make_box("stsz", stsz_p);

    BoxBuf stco_p;
    stco_p.u32(0);
    stco_p.u32(static_cast<uint32_t>(num_frames));
    for (int f = 0; f < num_frames; ++f) stco_p.u32(sample_offsets[f]);
    BoxBuf stco = make_box("stco", stco_p);

    BoxBuf stbl_p;
    stbl_p.append(stsd);
    stbl_p.append(stts);
    stbl_p.append(stss);
    stbl_p.append(stsc);
    stbl_p.append(stsz);
    stbl_p.append(stco);
    BoxBuf stbl = make_box("stbl", stbl_p);

    BoxBuf minf_p;
    minf_p.append(vmhd);
    minf_p.append(dinf);
    minf_p.append(stbl);
    BoxBuf minf = make_box("minf", minf_p);

    BoxBuf mdia_p;
    mdia_p.append(mdhd);
    mdia_p.append(hdlr);
    mdia_p.append(minf);
    BoxBuf mdia = make_box("mdia", mdia_p);

    BoxBuf trak_p;
    trak_p.append(tkhd);
    trak_p.append(mdia);
    BoxBuf trak = make_box("trak", trak_p);

    BoxBuf moov_p;
    moov_p.append(mvhd);
    moov_p.append(trak);
    BoxBuf moov = make_box("moov", moov_p);

    std::ofstream out(path, std::ios::binary);
    if (!out) return false;
    out.write(reinterpret_cast<const char*>(ftyp.d.data()), ftyp.d.size());
    out.write(reinterpret_cast<const char*>(mdat.d.data()), mdat.d.size());
    out.write(reinterpret_cast<const char*>(moov.d.data()), moov.d.size());
    return out.good();
}

// ==================== GIF89a with LZW Variable-Width Encoder ====================

namespace {

void lzw_encode_gif_frame(const uint8_t* indices, size_t n_pixels, int min_code_size, std::vector<uint8_t>& out_blocks) {
    const int clear_code = 1 << min_code_size;
    const int end_code = clear_code + 1;

    // 4096-entry LZW trie: next_table[prefix * 64 + sym] (min_code_size == 6 -> 64 alphabet!)
    const int alpha = 1 << min_code_size;
    std::vector<int16_t> trie(4096 * alpha, -1);

    std::vector<uint8_t> raw_bytes;
    raw_bytes.reserve(n_pixels / 2 + 64);

    uint32_t bit_buf = 0;
    int bit_cnt = 0;
    auto emit_code = [&](int code, int width) {
        bit_buf |= (static_cast<uint32_t>(code) << bit_cnt);
        bit_cnt += width;
        while (bit_cnt >= 8) {
            raw_bytes.push_back(static_cast<uint8_t>(bit_buf & 0xFF));
            bit_buf >>= 8;
            bit_cnt -= 8;
        }
    };

    int code_size = min_code_size + 1;
    int next_code = end_code + 1;
    emit_code(clear_code, code_size);

    if (n_pixels > 0) {
        int prefix = indices[0] & (alpha - 1);
        for (size_t i = 1; i < n_pixels; ++i) {
            int sym = indices[i] & (alpha - 1);
            int16_t child = trie[prefix * alpha + sym];
            if (child != -1) {
                prefix = child;
            } else {
                emit_code(prefix, code_size);
                if (next_code < 4096) {
                    trie[prefix * alpha + sym] = static_cast<int16_t>(next_code);
                    if (next_code == (1 << code_size) && code_size < 12) {
                        code_size++;
                    }
                    next_code++;
                } else {
                    emit_code(clear_code, code_size);
                    std::fill(trie.begin(), trie.end(), -1);
                    code_size = min_code_size + 1;
                    next_code = end_code + 1;
                }
                prefix = sym;
            }
        }
        emit_code(prefix, code_size);
    }

    emit_code(end_code, code_size);
    if (bit_cnt > 0) {
        raw_bytes.push_back(static_cast<uint8_t>(bit_buf & 0xFF));
    }

    out_blocks.push_back(static_cast<uint8_t>(min_code_size));
    size_t pos = 0;
    while (pos < raw_bytes.size()) {
        size_t chunk = std::min<size_t>(255, raw_bytes.size() - pos);
        out_blocks.push_back(static_cast<uint8_t>(chunk));
        out_blocks.insert(out_blocks.end(), raw_bytes.begin() + pos, raw_bytes.begin() + pos + chunk);
        pos += chunk;
    }
    out_blocks.push_back(0x00); // Block terminator
}

} // namespace

bool write_gif89a(
    const std::string& path,
    const uint8_t* rgb_frames,
    int num_frames,
    int width,
    int height,
    int fps
) {
    if (num_frames <= 0 || width <= 0 || height <= 0) return false;

    // Build 64-entry Global Color Table: 0..47 = Master Anime Palette, 48 = pure black, 49 = subtitle yellow, rest padded
    uint8_t gct[64 * 3] = {};
    std::memcpy(gct, get_master_palette_rgb(), PALETTE_SIZE * 3);
    gct[48 * 3 + 0] = 6;   gct[48 * 3 + 1] = 6;   gct[48 * 3 + 2] = 10;  // Subtitle bar dark
    gct[49 * 3 + 0] = 255; gct[49 * 3 + 1] = 236; gct[49 * 3 + 2] = 120; // Subtitle warm yellow
    const int num_active_colors = 50;

    std::ofstream f(path, std::ios::binary);
    if (!f) return false;

    // Header + Logical Screen Descriptor (64-color GCT -> size field = 5 since 2^(5+1) = 64)
    f.write("GIF89a", 6);
    uint8_t lsd[7] = {
        static_cast<uint8_t>(width & 0xFF), static_cast<uint8_t>((width >> 8) & 0xFF),
        static_cast<uint8_t>(height & 0xFF), static_cast<uint8_t>((height >> 8) & 0xFF),
        0xF5, // GCT flag=1, color res=7, sort=0, size=5 (64 entries)
        0x00, 0x00
    };
    f.write(reinterpret_cast<const char*>(lsd), 7);
    f.write(reinterpret_cast<const char*>(gct), sizeof(gct));

    // NETSCAPE2.0 Infinite Loop Extension
    const uint8_t netscape[19] = {
        0x21, 0xFF, 0x0B,
        'N','E','T','S','C','A','P','E','2','.','0',
        0x03, 0x01, 0x00, 0x00, 0x00
    };
    f.write(reinterpret_cast<const char*>(netscape), 19);

    uint16_t delay_cs = static_cast<uint16_t>(std::max(2, (100 + fps / 2) / std::max(1, fps)));
    size_t npix = static_cast<size_t>(width) * height;
    std::vector<uint8_t> frame_idx(npix);
    std::vector<uint8_t> lzw_buf;

    for (int fr = 0; fr < num_frames; ++fr) {
        const uint8_t* rgb = rgb_frames + static_cast<size_t>(fr) * npix * 3;
        #pragma omp parallel for schedule(static)
        for (size_t i = 0; i < npix; ++i) {
            int r = rgb[i * 3 + 0], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
            int best_k = 0;
            int best_d = 1e9;
            for (int k = 0; k < num_active_colors; ++k) {
                int dr = r - gct[k * 3 + 0];
                int dg = g - gct[k * 3 + 1];
                int db = b - gct[k * 3 + 2];
                int d = dr * dr + dg * dg + db * db;
                if (d == 0) { best_k = k; break; }
                if (d < best_d) { best_d = d; best_k = k; }
            }
            frame_idx[i] = static_cast<uint8_t>(best_k);
        }

        // Graphic Control Extension
        uint8_t gce[8] = {
            0x21, 0xF9, 0x04, 0x04,
            static_cast<uint8_t>(delay_cs & 0xFF),
            static_cast<uint8_t>((delay_cs >> 8) & 0xFF),
            0x00, 0x00
        };
        f.write(reinterpret_cast<const char*>(gce), 8);

        // Image Descriptor
        uint8_t idesc[10] = {
            0x2C, 0x00, 0x00, 0x00, 0x00,
            static_cast<uint8_t>(width & 0xFF), static_cast<uint8_t>((width >> 8) & 0xFF),
            static_cast<uint8_t>(height & 0xFF), static_cast<uint8_t>((height >> 8) & 0xFF),
            0x00
        };
        f.write(reinterpret_cast<const char*>(idesc), 10);

        lzw_buf.clear();
        lzw_encode_gif_frame(frame_idx.data(), npix, 6, lzw_buf);
        f.write(reinterpret_cast<const char*>(lzw_buf.data()), lzw_buf.size());
    }

    uint8_t trailer = 0x3B;
    f.write(reinterpret_cast<const char*>(&trailer), 1);
    return f.good();
}

// ==================== Japanese Pentatonic Anime OST & SFX WAV Synthesizer ====================

bool synthesize_anime_ost_wav(
    const std::string& path,
    const int* shot_actions,
    const int* shot_fx,
    const int* shot_mood,
    int num_shots,
    int frames_per_shot,
    int fps
) {
    if (num_shots <= 0 || frames_per_shot <= 0 || fps <= 0) return false;
    const int sample_rate = 44100;
    double shot_dur = static_cast<double>(frames_per_shot) / static_cast<double>(fps);
    double total_dur = shot_dur * num_shots;
    size_t total_samples = static_cast<size_t>(total_dur * sample_rate);
    if (total_samples == 0) return false;

    // Hirajoshi Japanese Pentatonic Scale (A minor anime mode: A3, B3, C4, E4, F4, A4, B4, C5, E5)
    static const double kHirajoshiHz[10] = {
        220.00, 246.94, 261.63, 329.63, 349.23,
        440.00, 493.88, 523.25, 659.25, 698.46
    };
    static const double kBassRoots[4] = {110.00, 87.31, 98.00, 82.41}; // A2, F2, G2, E2

    std::vector<int16_t> pcm(total_samples * 2, 0);
    uint32_t noise_state = 0x12345678U;
    double rain_lp = 0.0;

    for (size_t s = 0; s < total_samples; ++s) {
        double t = static_cast<double>(s) / sample_rate;
        int shot_idx = std::min(num_shots - 1, static_cast<int>(t / shot_dur));
        double local_t = t - shot_idx * shot_dur;
        int act = shot_actions ? shot_actions[shot_idx] : 0;
        int fx  = shot_fx ? shot_fx[shot_idx] : 0;
        int mood = shot_mood ? shot_mood[shot_idx] : 0;

        bool intense = (act >= 2);
        double step_sec = intense ? 0.16 : 0.28;
        int note_step = static_cast<int>(t / step_sec);
        double note_phase_t = std::fmod(t, step_sec);

        // 1. Plucked Koto / FM Chiptune Arpeggio
        int scale_idx = (note_step * 3 + shot_idx * 2 + (mood & 3)) % 9;
        if (intense) scale_idx = ((note_step % 4) * 2 + 1) % 10;
        double freq = kHirajoshiHz[scale_idx];
        double env = std::exp(-note_phase_t * (intense ? 9.0 : 5.5));
        double koto = env * (
            0.55 * std::sin(2.0 * M_PI * freq * t + 1.2 * env * std::sin(4.0 * M_PI * freq * t)) +
            0.25 * std::sin(4.0 * M_PI * freq * t)
        );

        // 2. Warm Stereo Pad + Driving Anime Bass
        double bass_hz = kBassRoots[(shot_idx + static_cast<int>(t / 1.6)) % 4];
        double pad_l = 0.18 * std::sin(2.0 * M_PI * bass_hz * 2.0 * t + 0.2 * std::sin(3.0 * t));
        double pad_r = 0.18 * std::sin(2.0 * M_PI * bass_hz * 2.004 * t + 0.8);
        double bass = 0.28 * std::tanh(2.2 * std::sin(2.0 * M_PI * bass_hz * t));
        if (intense) {
            double kick_t = std::fmod(t, 0.32);
            double kick = 0.42 * std::exp(-kick_t * 22.0) * std::sin(2.0 * M_PI * (120.0 * std::exp(-kick_t * 14.0) + 45.0) * kick_t);
            bass += kick;
        }

        // 3. Synchronized Anime Sound Effects (SFX)
        noise_state = noise_state * 1664525U + 1013904223U;
        double white = (static_cast<double>(noise_state >> 16) / 32768.0) - 1.0;
        double sfx = 0.0;

        if (fx == 1) {
            // Soft Rain ambience
            rain_lp = 0.92 * rain_lp + 0.08 * white;
            sfx += 0.10 * rain_lp;
        }
        if (act == 3) {
            // Katana slash whoosh + metallic ring around 45% of the shot!
            double slash_t = local_t - shot_dur * 0.42;
            if (slash_t >= 0.0 && slash_t < 0.45) {
                double s_env = std::exp(-slash_t * 11.0);
                double sweep = std::sin(2.0 * M_PI * (1800.0 - 1200.0 * slash_t) * slash_t);
                sfx += 0.45 * s_env * (0.5 * white + 0.5 * sweep);
            }
        } else if (act == 4 || act == 5) {
            // Arcane beam / Ki Aura rising shimmer
            double aura_f = 330.0 + 220.0 * (local_t / std::max(0.2, shot_dur));
            sfx += 0.16 * std::sin(2.0 * M_PI * aura_f * local_t) * (0.5 + 0.5 * std::sin(28.0 * local_t));
        }

        // Smooth fade-in and fade-out at episode ends
        double master = 0.65;
        if (t < 0.08) master *= (t / 0.08);
        if (total_dur - t < 0.25) master *= std::max(0.0, (total_dur - t) / 0.25);

        double left  = master * (koto * 0.42 + pad_l + bass + sfx);
        double right = master * (koto * 0.36 + pad_r + bass + sfx * 0.95);

        pcm[s * 2 + 0] = static_cast<int16_t>(std::clamp(left,  -0.98, 0.98) * 32767.0);
        pcm[s * 2 + 1] = static_cast<int16_t>(std::clamp(right, -0.98, 0.98) * 32767.0);
    }

    // Write RIFF WAVE header + PCM data
    std::ofstream f(path, std::ios::binary);
    if (!f) return false;
    uint32_t data_bytes = static_cast<uint32_t>(pcm.size() * sizeof(int16_t));
    uint32_t riff_size = 36 + data_bytes;
    uint16_t audio_fmt = 1, num_ch = 2, block_align = 4, bits_per_sample = 16;
    uint32_t sr = sample_rate, byte_rate = sample_rate * 4, fmt_size = 16;

    f.write("RIFF", 4);
    f.write(reinterpret_cast<const char*>(&riff_size), 4);
    f.write("WAVEfmt ", 8);
    f.write(reinterpret_cast<const char*>(&fmt_size), 4);
    f.write(reinterpret_cast<const char*>(&audio_fmt), 2);
    f.write(reinterpret_cast<const char*>(&num_ch), 2);
    f.write(reinterpret_cast<const char*>(&sr), 4);
    f.write(reinterpret_cast<const char*>(&byte_rate), 4);
    f.write(reinterpret_cast<const char*>(&block_align), 2);
    f.write(reinterpret_cast<const char*>(&bits_per_sample), 2);
    f.write("data", 4);
    f.write(reinterpret_cast<const char*>(&data_bytes), 4);
    f.write(reinterpret_cast<const char*>(pcm.data()), data_bytes);
    return f.good();
}

} // namespace sakuga
