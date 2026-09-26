import { File, FileMode } from 'expo-file-system';

export interface PkgMeta {
  title: string;
  contentId: string;
  titleId: string;
  /** Raw CATEGORY from param.sfo when available (e.g. `gd`, `ac`). */
  contentType: string;
  /** Uppercase hex digest at CNT+0xFE0 (32 bytes) — required by BGFT. */
  digest: string;
  packageSize: number;
}

function u32be(buf: Uint8Array, o: number): number {
  return ((buf[o]! << 24) | (buf[o + 1]! << 16) | (buf[o + 2]! << 8) | buf[o + 3]!) >>> 0;
}

function u64le(buf: Uint8Array, o: number): number {
  // Must use >>> 0 — JS << is signed 32-bit and corrupts offsets ≥ 0x80000000.
  const lo =
    (buf[o]! | (buf[o + 1]! << 8) | (buf[o + 2]! << 16) | (buf[o + 3]! << 24)) >>> 0;
  const hi =
    (buf[o + 4]! | (buf[o + 5]! << 8) | (buf[o + 6]! << 16) | (buf[o + 7]! << 24)) >>> 0;
  return hi * 0x1_0000_0000 + lo;
}

function asciiZ(buf: Uint8Array, o: number, n: number): string {
  let end = o;
  const max = Math.min(o + n, buf.length);
  while (end < max && buf[end] !== 0) end += 1;
  let s = '';
  for (let i = o; i < end; i++) s += String.fromCharCode(buf[i]!);
  return s.trim();
}

function toHexUpper(buf: Uint8Array): string {
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += buf[i]!.toString(16).padStart(2, '0').toUpperCase();
  }
  return out;
}

function titleIdFromContentId(contentId: string): string {
  const dash = contentId.split('-');
  let mid = dash.length >= 2 ? dash[1]! : contentId;
  const us = mid.indexOf('_');
  if (us > 0) mid = mid.slice(0, us);
  return mid.length >= 4 && mid.length <= 16 ? mid : '';
}

/**
 * Reads PS4/PS5 PKG container metadata without loading the whole file.
 * Digest + CONTENT_ID are what GoldHEN BGFT needs in the DPI manifest/callback.
 */
export async function readPkgMeta(
  uri: string,
  fallbackSize = 0,
  fallbackTitle = ''
): Promise<PkgMeta> {
  const empty: PkgMeta = {
    title: fallbackTitle,
    contentId: '',
    titleId: '',
    contentType: '',
    digest: '',
    packageSize: fallbackSize,
  };

  try {
    const file = new File(uri);
    const size = file.size ?? fallbackSize;
    empty.packageSize = size > 0 ? size : fallbackSize;

    const handle = file.open(FileMode.ReadOnly);
    try {
      handle.offset = 0;
      const head = handle.readBytes(0x60);
      if (head.byteLength < 4) return empty;

      let cntBase = 0;
      if (head[0] === 0x7f && head[1] === 0x46 && head[2] === 0x49 && head[3] === 0x48) {
        // FIH → embedded CNT offset at 0x58
        if (head.byteLength < 0x60) return empty;
        cntBase = u64le(head, 0x58);
        if (cntBase <= 0 || cntBase > size - 0x5a0) return empty;
      } else if (!(head[0] === 0x7f && head[1] === 0x43 && head[2] === 0x4e && head[3] === 0x54)) {
        return empty;
      }

      handle.offset = cntBase;
      const hdr = handle.readBytes(0x5a0);
      if (
        hdr.byteLength < 0x5a0 ||
        hdr[0] !== 0x7f ||
        hdr[1] !== 0x43 ||
        hdr[2] !== 0x4e ||
        hdr[3] !== 0x54
      ) {
        return empty;
      }

      const contentId = asciiZ(hdr, 0x40, 0x30);

      handle.offset = cntBase + 0xfe0;
      const digestBytes = handle.readBytes(32);
      const digest = digestBytes.byteLength === 32 ? toHexUpper(digestBytes) : '';

      // Best-effort: TITLE + CATEGORY from param.sfo (entry id 0x1000).
      let title = fallbackTitle;
      let contentType = '';
      try {
        const count = u32be(hdr, 0x10);
        const tableOff = u32be(hdr, 0x18);
        if (count > 0 && count < 0x10000 && tableOff > 0) {
          handle.offset = cntBase + tableOff;
          const table = handle.readBytes(count * 0x20);
          for (let i = 0; i < count; i++) {
            const o = i * 0x20;
            if (o + 0x20 > table.byteLength) break;
            const id = u32be(table, o);
            const flags = u32be(table, o + 8);
            const dataOff = u32be(table, o + 0x10);
            const dataSize = u32be(table, o + 0x14);
            if (id !== 0x1000 || (flags & 0x80000000) !== 0) continue;
            if (dataSize === 0 || dataSize > 1024 * 1024) break;
            handle.offset = cntBase + dataOff;
            const sfo = handle.readBytes(dataSize);
            const parsed = parseSfoStrings(sfo);
            if (parsed.TITLE) title = parsed.TITLE;
            if (parsed.CATEGORY) contentType = parsed.CATEGORY;
            break;
          }
        }
      } catch {
        /* optional */
      }

      return {
        title: title || fallbackTitle || contentId,
        contentId,
        titleId: titleIdFromContentId(contentId),
        contentType,
        digest,
        packageSize: empty.packageSize,
      };
    } finally {
      try {
        handle.close();
      } catch {
        /* ignore */
      }
    }
  } catch {
    return empty;
  }
}

/** Minimal SFO string table reader (utf8 keys TITLE / CATEGORY / …). */
function parseSfoStrings(b: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (b.byteLength < 0x14 || b[0] !== 0 || b[1] !== 0x50 || b[2] !== 0x53 || b[3] !== 0x46) {
    return out;
  }
  const keyTab = b[8]! | (b[9]! << 8) | (b[10]! << 16) | (b[11]! << 24);
  const dataTab = b[12]! | (b[13]! << 8) | (b[14]! << 16) | (b[15]! << 24);
  const n = b[16]! | (b[17]! << 8) | (b[18]! << 16) | (b[19]! << 24);
  if (n <= 0 || n > 4096) return out;

  for (let k = 0; k < n; k++) {
    const o = 0x14 + k * 0x10;
    if (o + 16 > b.byteLength) break;
    const keyOff = b[o]! | (b[o + 1]! << 8);
    const fmt = b[o + 2]! | (b[o + 3]! << 8);
    const len = b[o + 4]! | (b[o + 5]! << 8) | (b[o + 6]! << 16) | (b[o + 7]! << 24);
    const dataOff =
      b[o + 12]! | (b[o + 13]! << 8) | (b[o + 14]! << 16) | (b[o + 15]! << 24);
    const name = asciiZ(b, keyTab + keyOff, 64);
    if (fmt === 0x204 || fmt === 0x4) {
      const slen = fmt === 0x204 ? Math.max(0, len - 1) : Math.max(0, len);
      const start = dataTab + dataOff;
      if (start >= 0 && start + slen <= b.byteLength) {
        let s = '';
        for (let i = start; i < start + slen; i++) s += String.fromCharCode(b[i]!);
        out[name] = s.replace(/\0+$/g, '');
      }
    }
  }
  return out;
}
