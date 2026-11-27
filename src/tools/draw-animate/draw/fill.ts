function parseHexRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

/**
 * Iterative (stack-based) flood fill with color tolerance 24.
 * Transparent pixels (alpha <= 8) are treated as a single uniform region.
 * Returns true if at least one pixel changed.
 */
export function floodFillImageData(
  img: ImageData,
  startX: number,
  startY: number,
  fillHex: string,
  tolerance = 24,
): boolean {
  const { width, height, data } = img;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return false;

  const startIdx = (sy * width + sx) * 4;
  const sr = data[startIdx];
  const sg = data[startIdx + 1];
  const sb = data[startIdx + 2];
  const sa = data[startIdx + 3];
  const startIsTransparent = sa <= 8;

  const [fr, fg, fb, fa] = parseHexRgba(fillHex);
  if (
    !startIsTransparent &&
    Math.abs(sr - fr) <= 4 &&
    Math.abs(sg - fg) <= 4 &&
    Math.abs(sb - fb) <= 4 &&
    Math.abs(sa - fa) <= 4
  ) {
    return false;
  }

  const visited = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let sp = 0;
  stack[sp++] = sy * width + sx;
  visited[sy * width + sx] = 1;

  const matches = (idx4: number): boolean => {
    const a = data[idx4 + 3];
    if (startIsTransparent) {
      return a <= 8;
    }
    if (a <= 8) return false;
    return (
      Math.abs(data[idx4] - sr) <= tolerance &&
      Math.abs(data[idx4 + 1] - sg) <= tolerance &&
      Math.abs(data[idx4 + 2] - sb) <= tolerance &&
      Math.abs(a - sa) <= tolerance
    );
  };

  let changed = false;

  while (sp > 0) {
    const p = stack[--sp];
    const x = p % width;
    const y = (p - x) / width;
    const idx4 = p * 4;

    if (!matches(idx4)) continue;

    data[idx4] = fr;
    data[idx4 + 1] = fg;
    data[idx4 + 2] = fb;
    data[idx4 + 3] = fa;
    changed = true;

    if (x > 0) {
      const left = p - 1;
      if (!visited[left]) {
        visited[left] = 1;
        stack[sp++] = left;
      }
    }
    if (x + 1 < width) {
      const right = p + 1;
      if (!visited[right]) {
        visited[right] = 1;
        stack[sp++] = right;
      }
    }
    if (y > 0) {
      const up = p - width;
      if (!visited[up]) {
        visited[up] = 1;
        stack[sp++] = up;
      }
    }
    if (y + 1 < height) {
      const down = p + width;
      if (!visited[down]) {
        visited[down] = 1;
        stack[sp++] = down;
      }
    }
  }

  return changed;
}
