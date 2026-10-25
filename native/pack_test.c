/* POSIX verification harness for the SMPACK archive format used by the installer. */
#include "smpack.h"
#include <sys/stat.h>
#include <sys/types.h>

static void ensure_dirs(const char *path) {
    char tmp[1024];
    snprintf(tmp, sizeof(tmp), "%s", path);
    for (char *p = tmp + 1; *p; p++) {
        if (*p == '/') { *p = 0; mkdir(tmp, 0755); *p = '/'; }
    }
}

int main(int argc, char **argv) {
    if (argc < 3) { fprintf(stderr, "usage: %s <packed-file> <out-dir>\n", argv[0]); return 2; }
    FILE *f = fopen(argv[1], "rb");
    if (!f) { perror("open"); return 1; }
    long offset; uint64_t count;
    if (!smpack_read_footer(f, &offset, &count)) { printf("FAIL: no SMPACK footer\n"); return 1; }
    printf("archive offset=%ld entries=%llu\n", offset, (unsigned long long)count);
    if (fseek(f, offset, SEEK_SET) != 0) { printf("FAIL: seek\n"); return 1; }

    for (uint64_t i = 0; i < count; i++) {
        smpack_entry e;
        if (!smpack_read_entry(f, &e)) { printf("FAIL: entry %llu header\n", (unsigned long long)i); return 1; }
        char out[2048];
        snprintf(out, sizeof(out), "%s/%s", argv[2], e.path);
        ensure_dirs(out);
        FILE *o = fopen(out, "wb");
        if (!o) { printf("FAIL: cannot write %s\n", out); return 1; }
        char buf[65536];
        uint64_t left = e.size;
        while (left) {
            size_t chunk = left > sizeof(buf) ? sizeof(buf) : (size_t)left;
            if (fread(buf, 1, chunk, f) != chunk) { printf("FAIL: short read %s\n", e.path); return 1; }
            fwrite(buf, 1, chunk, o);
            left -= chunk;
        }
        fclose(o);
        printf("  extracted %-44s %10llu bytes\n", e.path, (unsigned long long)e.size);
    }
    fclose(f);
    printf("SMPACK extraction OK\n");
    return 0;
}
