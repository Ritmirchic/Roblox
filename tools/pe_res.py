#!/usr/bin/env python3
"""
pe_res.py - injects an application icon, version info and an application manifest
into an existing x86_64 PE executable (as produced by the zig/lld cross build).

Usage: pe_res.py <in.exe> <out.exe> [version]

Appends a .rsrc section with RT_ICON / RT_GROUP_ICON / RT_VERSION / RT_MANIFEST and
points the resource data directory at it.
"""
import struct, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RT_ICON, RT_GROUP_ICON, RT_VERSION, RT_MANIFEST = 3, 14, 16, 24


def align(v, a):
    return (v + a - 1) // a * a


# ------------------------------------------------------------------ PE reader
class PE:
    def __init__(self, data):
        self.d = bytearray(data)
        d = self.d
        if d[:2] != b"MZ":
            raise SystemExit("not a PE file")
        self.e_lfanew = struct.unpack_from("<I", d, 0x3C)[0]
        if d[self.e_lfanew:self.e_lfanew + 4] != b"PE\0\0":
            raise SystemExit("missing PE signature")
        coff = self.e_lfanew + 4
        (self.machine, self.nsect, self.tstamp, self.psymtab, self.nsyms,
         self.opt_size, self.characteristics) = struct.unpack_from("<HHIIIHH", d, coff)
        self.opt = coff + 20
        if struct.unpack_from("<H", d, self.opt)[0] != 0x20B:
            raise SystemExit("expected a PE32+ (64-bit) image")
        self.image_base = struct.unpack_from("<Q", d, self.opt + 24)[0]
        self.sect_align = struct.unpack_from("<I", d, self.opt + 32)[0]
        self.file_align = struct.unpack_from("<I", d, self.opt + 36)[0]
        self.size_image = struct.unpack_from("<I", d, self.opt + 56)[0]
        self.size_headers = struct.unpack_from("<I", d, self.opt + 60)[0]
        self.checksum_off = self.opt + 64
        self.n_dirs = struct.unpack_from("<I", d, self.opt + 108)[0]
        self.dir_off = self.opt + 112
        self.sections = []
        so = self.opt + self.opt_size
        for _ in range(self.nsect):
            name = bytes(d[so:so + 8]).rstrip(b"\0").decode("latin1", "replace")
            vsize, va, rsize, rptr = struct.unpack_from("<IIII", d, so + 8)
            self.sections.append(dict(name=name, vsize=vsize, va=va, rsize=rsize,
                                      rptr=rptr, hdr=so))
            so += 40


# --------------------------------------------------------- resource section
def build_rsrc(entries):
    """entries: list of (type_id, name_id, payload).
    Returns (section_bytes, patches, payload_count) where patches is a list of
    (section_offset_of_data_entry, payload_offset)."""
    tree = {}
    for t, n, p in entries:
        tree.setdefault(t, {})[n] = p
    types = sorted(tree.keys())
    nodes = []          # dict(id, kids=[node index], payload=-1)
    payloads = []

    def new_node(nid):
        nodes.append({"id": nid, "kids": [], "payload": -1})
        return len(nodes) - 1

    root = new_node(0)
    for t in types:
        ti = new_node(t)
        nodes[root]["kids"].append(ti)
        for n in sorted(tree[t].keys()):
            payloads.append(tree[t][n])
            ni = new_node(n)
            nodes[ti]["kids"].append(ni)
            # language level (0x409 = en-US) pointing at the data entry
            li = new_node(0x409)
            nodes[li]["payload"] = len(payloads) - 1
            nodes[ni]["kids"].append(li)

    # ---- layout
    offsets = []
    cursor = 0
    for nd in nodes:
        offsets.append(cursor)
        cursor += 16 + 8 * len(nd["kids"])
    data_entry_base = cursor
    cursor += 16 * len(payloads)
    payload_off = []
    for p in payloads:
        cursor = align(cursor, 8)
        payload_off.append(cursor)
        cursor += len(p)
    out = bytearray(align(cursor, 8))

    # ---- directories
    for i, nd in enumerate(nodes):
        base = offsets[i]
        struct.pack_into("<IIHHHH", out, base, 0, 0, 0, 0, 0, len(nd["kids"]))
        for j, kid in enumerate(nd["kids"]):
            kn = nodes[kid]
            if kn["kids"]:
                target = 0x80000000 | offsets[kid]
            else:
                target = data_entry_base + 16 * kn["payload"]
            struct.pack_into("<II", out, base + 16 + 8 * j, kn["id"], target)
    # ---- data entries (RVA patched by the caller) + payloads
    for i, p in enumerate(payloads):
        struct.pack_into("<IIII", out, data_entry_base + 16 * i, 0, len(p), 0, 0)
    for i, p in enumerate(payloads):
        out[payload_off[i]:payload_off[i] + len(p)] = p
    patches = [(data_entry_base + 16 * i, payload_off[i]) for i in range(len(payloads))]
    return bytes(out), patches, len(payloads)


def ico_payloads(path):
    blob = open(path, "rb").read()
    _, _, count = struct.unpack_from("<HHH", blob, 0)
    icons = []
    for i in range(count):
        w, h, cc, res, planes, bpp, size, off = struct.unpack_from("<BBBBHHII", blob,
                                                                  6 + 16 * i)
        icons.append(((w or 256), (h or 256), bpp, blob[off:off + size]))
    grp = bytearray(struct.pack("<HHH", 0, 1, len(icons)))
    for i, (w, h, bpp, idata) in enumerate(icons):
        grp += struct.pack("<BBBBHHIH", 0 if w >= 256 else w, 0 if h >= 256 else h, 0, 0,
                           1, bpp, len(idata), i + 1)
    return icons, bytes(grp)


def make_manifest():
    return (b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            b'<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">\r\n'
            b' <assemblyIdentity type="win32" name="Fracture.TotalDestruction"'
            b' version="1.0.1.0" processorArchitecture="amd64"/>\r\n'
            b' <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3"><security>'
            b'<requestedPrivileges><requestedExecutionLevel level="asInvoker"'
            b' uiAccess="false"/></requestedPrivileges></security></trustInfo>\r\n'
            b' <application xmlns="urn:schemas-microsoft-com:asm.v3"><windowsSettings>'
            b'<dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">'
            b'true/pm</dpiAware></windowsSettings></application>\r\n'
            b'</assembly>\r\n')


def make_version(version="1.0.1"):
    parts = [int(x) for x in version.split(".")]
    while len(parts) < 4:
        parts.append(0)
    ms = (parts[0] << 16) | parts[1]
    ls = (parts[2] << 16) | parts[3]

    def pad4(b):
        return b + b"\0" * ((4 - len(b) % 4) % 4)

    def block(key, value, wtype=1, children=b""):
        if isinstance(value, str):
            value = value.encode("utf-16-le") + b"\0\0"
            vlen = len(value) // 2
        else:
            vlen = len(value)
        body = key.encode("utf-16-le") + b"\0\0"
        hdr = align(6 + len(body), 4)
        body = body.ljust(hdr - 6, b"\0")
        head = struct.pack("<HHH", hdr + len(value) + len(children), vlen, wtype) + body
        return pad4(head + value + children)

    ffi = struct.pack("<IIIIIIIIIIIII", 0xFEEF04BD, 0x00010000, ms, ls, ms, ls, 0x3F, 0,
                      0x40004, 1, 0, 0, 0)
    strings = [("CompanyName", "Fracture Studios"),
               ("FileDescription", "FRACTURE: TOTAL DESTRUCTION"),
               ("FileVersion", version),
               ("InternalName", "FRACTURE_TOTAL_DESTRUCTION"),
               ("LegalCopyright", "Original work built on the Fracture voxel engine"),
               ("OriginalFilename", "FRACTURE_TOTAL_DESTRUCTION.exe"),
               ("ProductName", "FRACTURE: TOTAL DESTRUCTION"),
               ("ProductVersion", version)]
    str_children = b"".join(block(k, v) for k, v in strings)
    string_table = block("040904b0", str_children, 1)
    string_file_info = block("StringFileInfo", string_table, 1)
    translation = block("Translation", struct.pack("<HH", 0x409, 0x4B0), 0)
    var_file_info = block("VarFileInfo", translation, 1)
    return block("VS_VERSION_INFO", ffi, 0, string_file_info + var_file_info)


def main():
    if len(sys.argv) < 3:
        print("usage: pe_res.py in.exe out.exe [version]")
        return 1
    src, dst = sys.argv[1], sys.argv[2]
    version = sys.argv[3] if len(sys.argv) > 3 else "1.0.1"
    pe = PE(open(src, "rb").read())
    entries = []
    ico = os.path.join(ROOT, "assets", "icon.ico")
    if os.path.exists(ico):
        icons, grp = ico_payloads(ico)
        for i, (w, h, bpp, data) in enumerate(icons):
            entries.append((RT_ICON, i + 1, data))
        entries.append((RT_GROUP_ICON, 101, grp))
    else:
        print("  (assets/icon.ico missing - run tools/make_icon.py first)")
    entries.append((RT_VERSION, 1, make_version(version)))
    entries.append((RT_MANIFEST, 1, make_manifest()))

    sect, patches, npayload = build_rsrc(entries)
    last = pe.sections[-1]
    new_va = align(last["va"] + max(last["vsize"], last["rsize"]), pe.sect_align)
    file_ptr = align(len(pe.d), pe.file_align)

    s = bytearray(sect)
    for off, payoff in patches:
        struct.pack_into("<I", s, off, new_va + payoff)
    sect = bytes(s)

    out = bytearray(pe.d)
    out += b"\0" * (file_ptr - len(out))
    out += sect
    out += b"\0" * (align(len(out), pe.file_align) - len(out))

    newhdr_off = pe.opt + pe.opt_size + 40 * pe.nsect
    if newhdr_off + 40 > pe.size_headers:
        raise SystemExit("no room for another section header in the PE headers")
    hdr = bytearray(40)
    hdr[0:8] = b".rsrc\0\0\0"
    struct.pack_into("<IIII", hdr, 8, len(sect), new_va, align(len(sect), pe.file_align),
                     file_ptr)
    struct.pack_into("<IIHHI", hdr, 24, 0, 0, 0, 0, 0x40000040)
    out[newhdr_off:newhdr_off + 40] = hdr
    struct.pack_into("<H", out, pe.e_lfanew + 6, pe.nsect + 1)
    struct.pack_into("<I", out, pe.opt + 56, align(new_va + len(sect), pe.sect_align))
    struct.pack_into("<II", out, pe.dir_off + 8 * 2, new_va, len(sect))
    struct.pack_into("<I", out, pe.checksum_off, 0)
    open(dst, "wb").write(out)
    print("  resources: %d payloads, .rsrc %d bytes at RVA 0x%x, exe %d bytes"
          % (npayload, len(sect), new_va, len(out)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
