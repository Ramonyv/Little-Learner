import type { GridSize, PixelColor } from '../engine/types';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const dict = new Map<string, number>();

  const resetDict = () => {
    dict.clear();
    for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };
  resetDict();

  const out: number[] = [];
  let bitBuf = 0;
  let bitCount = 0;
  const writeBits = (code: number, len: number) => {
    bitBuf |= code << bitCount;
    bitCount += len;
    while (bitCount >= 8) {
      out.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };

  writeBits(clearCode, codeSize);
  let prefix = String(indices[0] ?? 0);
  for (let i = 1; i < indices.length; i++) {
    const k = String(indices[i]);
    const combined = `${prefix},${k}`;
    if (dict.has(combined)) {
      prefix = combined;
    } else {
      writeBits(dict.get(prefix)!, codeSize);
      if (nextCode < 4096) {
        dict.set(combined, nextCode++);
        if (nextCode > 1 << codeSize && codeSize < 12) codeSize++;
      } else {
        writeBits(clearCode, codeSize);
        resetDict();
      }
      prefix = k;
    }
  }
  writeBits(dict.get(prefix)!, codeSize);
  writeBits(eoiCode, codeSize);
  if (bitCount > 0) out.push(bitBuf & 0xff);

  // Pack into GIF sub-blocks (<= 255 bytes each)
  const blocks: number[] = [minCodeSize];
  for (let i = 0; i < out.length; i += 255) {
    const chunk = out.slice(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  blocks.push(0); // block terminator
  return Uint8Array.from(blocks);
}

/**
 * Pure-JS GIF89a animated encoder (lazy-loaded on export).
 */
export function exportFlipbookGif(
  frames: number[][],
  size: GridSize,
  palette: PixelColor[],
  fps: number,
  title: string,
): void {
  const scale = size <= 16 ? 8 : size <= 32 ? 4 : 2;
  const w = size * scale;
  const h = size * scale;
  const delayCs = Math.max(4, Math.round(100 / Math.max(1, fps)));

  // Global Color Table: 32 or 64 colors (power of 2)
  const gctPow = palette.length + 1 <= 32 ? 4 : 5; // 2^(pow+1) = 32 or 64
  const gctSize = 1 << (gctPow + 1);
  const gct = new Uint8Array(gctSize * 3);
  // Index 0 = white background
  gct[0] = 255;
  gct[1] = 255;
  gct[2] = 255;
  for (let i = 0; i < palette.length && i + 1 < gctSize; i++) {
    const [r, g, b] = hexToRgb(palette[i].hex);
    gct[(i + 1) * 3] = r;
    gct[(i + 1) * 3 + 1] = g;
    gct[(i + 1) * 3 + 2] = b;
  }

  const bytes: number[] = [];
  const pushAscii = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
  };
  const pushU16 = (v: number) => {
    bytes.push(v & 0xff, (v >> 8) & 0xff);
  };

  // Header + Logical Screen Descriptor
  pushAscii('GIF89a');
  pushU16(w);
  pushU16(h);
  bytes.push(0x80 | (gctPow << 4) | gctPow, 0, 0);
  bytes.push(...gct);

  // Netscape 2.0 infinite loop extension
  bytes.push(0x21, 0xff, 0x0b);
  pushAscii('NETSCAPE2.0');
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const minCodeSize = gctPow + 1;
  for (const frame of frames) {
    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04, 0x04);
    pushU16(delayCs);
    bytes.push(0, 0);

    // Image Descriptor
    bytes.push(0x2c);
    pushU16(0);
    pushU16(0);
    pushU16(w);
    pushU16(h);
    bytes.push(0);

    const expanded = new Uint8Array(w * h);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = frame[y * size + x] ?? 0;
        const safeVal = val < gctSize ? val : 0;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            expanded[(y * scale + sy) * w + (x * scale + sx)] = safeVal;
          }
        }
      }
    }
    bytes.push(...lzwEncode(expanded, minCodeSize));
  }

  bytes.push(0x3b); // Trailer

  const blob = new Blob([Uint8Array.from(bytes)], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(title || 'pixel-flipbook').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.gif`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
