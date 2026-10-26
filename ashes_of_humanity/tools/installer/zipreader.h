// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Self contained ZIP reader (raw DEFLATE decoder).
// ============================================================================
#pragma once
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

namespace zip {
// ---------------------------------------------------------------------------
// Minimal inflate implementation
// ---------------------------------------------------------------------------

typedef unsigned char  u8;
typedef unsigned short u16;
typedef unsigned int   u32;

struct BitReader {
  const u8* data = nullptr;
  size_t size = 0;
  size_t pos = 0;
  u32 bitbuf = 0;
  int bitcnt = 0;

  void init(const u8* d, size_t s) { data = d; size = s; pos = 0; bitbuf = 0; bitcnt = 0; }
  int bit() {
    if (bitcnt == 0) {
      if (pos >= size) return -1;
      bitbuf = data[pos++];
      bitcnt = 8;
    }
    int b = bitbuf & 1;
    bitbuf >>= 1;
    bitcnt--;
    return b;
  }
  u32 bits(int n) {
    u32 v = 0;
    for (int i = 0; i < n; ++i) {
      int b = bit();
      if (b < 0) return v;
      v |= (u32)(b & 1) << i;
    }
    return v;
  }
  void align() { bitcnt = 0; bitbuf = 0; }
};

struct Huffman {
  u16 counts[16] = {0};
  std::vector<u16> symbols;
};

static void buildHuffman(Huffman& h, const u8* lengths, int n) {
  for (int i = 0; i < 16; ++i) h.counts[i] = 0;
  for (int i = 0; i < n; ++i) h.counts[lengths[i]]++;
  h.counts[0] = 0;
  u16 offs[16];
  offs[0] = 0; offs[1] = 0;
  for (int i = 1; i < 15; ++i) offs[i + 1] = (u16)(offs[i] + h.counts[i]);
  h.symbols.assign((size_t)n, 0);
  for (int i = 0; i < n; ++i)
    if (lengths[i]) h.symbols[offs[lengths[i]]++] = (u16)i;
}

static int decodeSym(BitReader& br, const Huffman& h) {
  int code = 0, first = 0, index = 0;
  for (int len = 1; len <= 15; ++len) {
    int b = br.bit();
    if (b < 0) return -1;
    code |= b;
    int count = h.counts[len];
    if (code - first < count) return h.symbols[(size_t)(index + (code - first))];
    index += count;
    first += count;
    first <<= 1;
    code <<= 1;
  }
  return -1;
}

static const u16 LEN_BASE[29] = { 3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,
                                  67,83,99,115,131,163,195,227,258 };
static const u8  LEN_EXTRA[29] = { 0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0 };
static const u16 DIST_BASE[30] = { 1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,
                                   1025,1537,2049,3073,4097,6145,8193,12289,16385,24577 };
static const u8  DIST_EXTRA[30] = { 0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13 };

// Inflates a raw DEFLATE stream into `out`.  Returns false on error.
static bool inflateRaw(const u8* src, size_t srcLen, std::vector<u8>& out) {
  BitReader br;
  br.init(src, srcLen);
  Huffman fixedLit, fixedDist;
  {
    u8 l[288];
    for (int i = 0; i < 144; ++i) l[i] = 8;
    for (int i = 144; i < 256; ++i) l[i] = 9;
    for (int i = 256; i < 280; ++i) l[i] = 7;
    for (int i = 280; i < 288; ++i) l[i] = 8;
    buildHuffman(fixedLit, l, 288);
    u8 d[30];
    for (int i = 0; i < 30; ++i) d[i] = 5;
    buildHuffman(fixedDist, d, 30);
  }
  const u8 ORDER[19] = { 16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15 };

  for (;;) {
    int last = br.bit();
    if (last < 0) return false;
    int type = (int)br.bits(2);
    if (type == 0) {
      br.align();
      if (br.pos + 4 > br.size) return false;
      u16 len = (u16)(br.data[br.pos] | (br.data[br.pos + 1] << 8));
      u16 nlen = (u16)(br.data[br.pos + 2] | (br.data[br.pos + 3] << 8));
      br.pos += 4;
      if ((u16)~len != nlen) return false;
      if (br.pos + len > br.size) return false;
      out.insert(out.end(), br.data + br.pos, br.data + br.pos + len);
      br.pos += len;
    } else if (type == 1 || type == 2) {
      Huffman litH, distH;
      const Huffman* lit = &fixedLit;
      const Huffman* dst = &fixedDist;
      if (type == 2) {
        int hlit = (int)br.bits(5) + 257;
        int hdist = (int)br.bits(5) + 1;
        int hclen = (int)br.bits(4) + 4;
        u8 clen[19] = {0};
        for (int i = 0; i < hclen; ++i) clen[ORDER[i]] = (u8)br.bits(3);
        Huffman clH;
        buildHuffman(clH, clen, 19);
        u8 lengths[320] = {0};
        int i = 0;
        while (i < hlit + hdist) {
          int sym = decodeSym(br, clH);
          if (sym < 0) return false;
          if (sym < 16) {
            lengths[i++] = (u8)sym;
          } else if (sym == 16) {
            if (i == 0) return false;
            u8 prev = lengths[i - 1];
            int rep = 3 + (int)br.bits(2);
            while (rep-- && i < hlit + hdist) lengths[i++] = prev;
          } else if (sym == 17) {
            int rep = 3 + (int)br.bits(3);
            while (rep-- && i < hlit + hdist) lengths[i++] = 0;
          } else {
            int rep = 11 + (int)br.bits(7);
            while (rep-- && i < hlit + hdist) lengths[i++] = 0;
          }
        }
        buildHuffman(litH, lengths, hlit);
        buildHuffman(distH, lengths + hlit, hdist);
        lit = &litH;
        dst = &distH;
      }
      for (;;) {
        int sym = decodeSym(br, *lit);
        if (sym < 0) return false;
        if (sym < 256) {
          out.push_back((u8)sym);
        } else if (sym == 256) {
          break;
        } else {
          sym -= 257;
          if (sym >= 29) return false;
          int len = LEN_BASE[sym] + (int)br.bits(LEN_EXTRA[sym]);
          int dsym = decodeSym(br, *dst);
          if (dsym < 0 || dsym >= 30) return false;
          int dist = DIST_BASE[dsym] + (int)br.bits(DIST_EXTRA[dsym]);
          if ((size_t)dist > out.size()) return false;
          size_t start = out.size() - (size_t)dist;
          for (int k = 0; k < len; ++k) out.push_back(out[start + (size_t)k]);
        }
      }
    } else {
      return false;
    }
    if (last) break;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Minimal ZIP reader
// ---------------------------------------------------------------------------
struct ZipEntry {
  std::string name;
  u32 method = 0;
  u32 compSize = 0;
  u32 uncompSize = 0;
  u32 localOffset = 0;
};

// Archive entries always use forward slashes.  Windows needs backslashes, and
// every directory level has to exist before a file can be written.
static std::string nativePath(const std::string& name) {
  std::string out = name;
  for (size_t i = 0; i < out.size(); ++i)
    if (out[i] == '/') out[i] = '\\';
  return out;
}

static u16 rd16(const u8* p) { return (u16)(p[0] | (p[1] << 8)); }
static u32 rd32(const u8* p) {
  return (u32)p[0] | ((u32)p[1] << 8) | ((u32)p[2] << 16) | ((u32)p[3] << 24);
}

// Returns the offset of the end of central directory record, or 0 on failure.
static u32 findEOCD(const u8* data, size_t size) {
  if (size < 22) return 0;
  size_t start = (size > 66000) ? size - 66000 : 0;
  for (size_t i = size - 22 + 1; i-- > start;) {
    if (data[i] == 0x50 && data[i + 1] == 0x4b && data[i + 2] == 0x05 && data[i + 3] == 0x06)
      return (u32)i;
  }
  return 0;
}

// Locates the ZIP archive inside a larger image (the installer stub has the
// package appended to it) and parses its central directory.
static bool readZip(const u8* data, size_t size, std::vector<ZipEntry>& entries,
                    size_t* baseOut = nullptr) {
  u32 eocd = findEOCD(data, size);
  if (!eocd) return false;
  u16 count = rd16(data + eocd + 10);
  u32 cdSize = rd32(data + eocd + 12);
  u32 cdOffset = rd32(data + eocd + 16);
  if ((size_t)eocd < cdSize) return false;
  size_t cdAbsStart = (size_t)eocd - cdSize;
  if (cdAbsStart < cdOffset) return false;
  size_t base = cdAbsStart - cdOffset;      // archive start inside the image
  if (baseOut) *baseOut = base;
  u32 p = (u32)cdAbsStart;
  for (int i = 0; i < count; ++i) {
    if (p + 46 > size) return false;
    if (rd32(data + p) != 0x02014b50) return false;
    ZipEntry e;
    e.method = rd16(data + p + 10);
    e.compSize = rd32(data + p + 20);
    e.uncompSize = rd32(data + p + 24);
    u16 nameLen = rd16(data + p + 28);
    u16 extraLen = rd16(data + p + 30);
    u16 commentLen = rd16(data + p + 32);
    e.localOffset = rd32(data + p + 42);
    e.name.assign((const char*)(data + p + 46), nameLen);
    entries.push_back(e);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return true;
}

static bool extractEntry(const u8* data, size_t size, const ZipEntry& e, std::vector<u8>& out,
                         size_t base = 0) {
  u32 p = (u32)(base + e.localOffset);
  if (p + 30 > size) return false;
  if (rd32(data + p) != 0x04034b50) return false;
  u16 nameLen = rd16(data + p + 26);
  u16 extraLen = rd16(data + p + 28);
  const u8* payload = data + p + 30 + nameLen + extraLen;
  size_t remaining = size - (size_t)(payload - data);
  if (e.method == 0) {
    size_t n = e.compSize;
    if (n > remaining) return false;
    out.assign(payload, payload + n);
    return true;
  } else if (e.method == 8) {
    out.clear();
    out.reserve(e.uncompSize);
    return inflateRaw(payload, e.compSize, out);
  }
  return false;
}

} // namespace zip
