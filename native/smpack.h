/*
 * SMPACK - the tiny archive format used by SPACE_MINER_SETUP.exe.
 *
 * Layout:  [installer executable][entry]*[footer]
 *   entry  : u32 pathLen | path (UTF-8, '/' separated) | u64 size | bytes
 *   footer : "SMPACK01" | u64 archiveOffset | u64 entryCount
 *
 * The payload is appended to the installer binary itself, so one .exe carries
 * the whole game. Parsing is shared between the Windows installer and the POSIX
 * test harness used during the build.
 */
#ifndef SMPACK_H
#define SMPACK_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define SMPACK_MAGIC "SMPACK01"
#define SMPACK_MAGIC_LEN 8
#define SMPACK_FOOTER_LEN (SMPACK_MAGIC_LEN + 16)

typedef struct {
    char path[1024];
    uint64_t size;
    long data_offset;
} smpack_entry;

/* Reads the footer of `f`; returns 1 and fills offsets on success. */
static int smpack_read_footer(FILE *f, long *archive_offset, uint64_t *entry_count) {
    if (fseek(f, -(long)SMPACK_FOOTER_LEN, SEEK_END) != 0) return 0;
    char magic[SMPACK_MAGIC_LEN];
    uint64_t offset = 0, count = 0;
    if (fread(magic, 1, SMPACK_MAGIC_LEN, f) != SMPACK_MAGIC_LEN) return 0;
    if (memcmp(magic, SMPACK_MAGIC, SMPACK_MAGIC_LEN) != 0) return 0;
    if (fread(&offset, sizeof(uint64_t), 1, f) != 1) return 0;
    if (fread(&count, sizeof(uint64_t), 1, f) != 1) return 0;
    *archive_offset = (long)offset;
    *entry_count = count;
    return 1;
}

/* Reads the next entry header at the current position. */
static int smpack_read_entry(FILE *f, smpack_entry *entry) {
    uint32_t path_len = 0;
    if (fread(&path_len, sizeof(uint32_t), 1, f) != 1) return 0;
    if (path_len == 0 || path_len >= sizeof(entry->path)) return 0;
    if (fread(entry->path, 1, path_len, f) != path_len) return 0;
    entry->path[path_len] = 0;
    if (fread(&entry->size, sizeof(uint64_t), 1, f) != 1) return 0;
    entry->data_offset = ftell(f);
    if (strstr(entry->path, "..")) return 0;       /* never write outside the target */
    return 1;
}

#endif /* SMPACK_H */
