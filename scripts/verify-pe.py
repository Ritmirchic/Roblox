#!/usr/bin/env python3
"""Validates the cross-compiled Windows binaries: PE headers, subsystem, imports, resources."""
import struct
import sys

def read_u16(d, o): return struct.unpack_from('<H', d, o)[0]
def read_u32(d, o): return struct.unpack_from('<I', d, o)[0]

def verify(path):
    data = open(path, 'rb').read()
    problems = []
    if data[:2] != b'MZ':
        return [f'{path}: not a PE file']
    pe = read_u32(data, 0x3c)
    if data[pe:pe + 4] != b'PE\x00\x00':
        return [f'{path}: missing PE signature']
    machine = read_u16(data, pe + 4)
    sections = read_u16(data, pe + 6)
    opt_size = read_u16(data, pe + 20)
    opt = pe + 24
    magic = read_u16(data, opt)
    subsystem = read_u16(data, opt + 68)

    if machine != 0x8664: problems.append(f'{path}: machine {hex(machine)} is not x86-64')
    if magic != 0x20b: problems.append(f'{path}: not PE32+ (64-bit)')
    if subsystem != 2: problems.append(f'{path}: subsystem {subsystem} is not Windows GUI')

    # Section table -> names, and locate .rsrc / imports.
    sec_table = opt + opt_size
    names = []
    rsrc_size = 0
    for i in range(sections):
        off = sec_table + i * 40
        name = data[off:off + 8].rstrip(b'\x00').decode('latin1')
        vsize = read_u32(data, off + 8)
        names.append(name)
        if name == '.rsrc':
            rsrc_size = vsize
    # Import DLL names are stored as ASCII in the data; a scan is enough for verification.
    dlls = sorted({d.decode('latin1').lower() for d in
                   __import__('re').findall(rb'[A-Za-z0-9_\-\.]+\.dll', data)})

    print(f'  {path}')
    print(f'    machine      : x86-64 PE32+')
    print(f'    subsystem    : {"Windows GUI" if subsystem == 2 else subsystem}')
    print(f'    sections     : {", ".join(names)}')
    print(f'    resources    : {rsrc_size} bytes {"(icon + version info)" if rsrc_size > 1000 else ""}')
    print(f'    imports      : {", ".join(d for d in dlls if not d.startswith("api-ms"))[:160]}')
    print(f'    size         : {len(data):,} bytes')
    if rsrc_size < 1000:
        problems.append(f'{path}: resource section looks empty (icon missing)')
    return problems

if __name__ == '__main__':
    all_problems = []
    for path in sys.argv[1:]:
        all_problems += verify(path)
    if all_problems:
        print('\nPE VERIFICATION FAILED')
        for p in all_problems: print(f'  - {p}')
        sys.exit(1)
    print('\n  PE verification passed')
