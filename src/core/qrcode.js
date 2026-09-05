/**
 * QR encoder — byte mode, versions 1–10, error correction level M.
 *
 * Written out rather than pulled from a CDN so table QR codes keep working
 * offline, cost nothing, and add no third-party script to the admin panel.
 * Version 10 at level M holds 213 bytes, which is far more than any
 * https://…/order?table=07 URL will ever need.
 */

/* --- Capacity tables (level M only) ------------------------------------- */
// [ total codewords, ec codewords per block, [ [blockCount, dataPerBlock], … ] ]
const VERSIONS = {
  1:  [26,  10, [[1, 16]]],
  2:  [44,  16, [[1, 28]]],
  3:  [70,  26, [[1, 44]]],
  4:  [100, 18, [[2, 32]]],
  5:  [134, 24, [[2, 43]]],
  6:  [172, 16, [[4, 27]]],
  7:  [196, 18, [[4, 31]]],
  8:  [242, 22, [[2, 38], [2, 39]]],
  9:  [292, 22, [[3, 36], [2, 37]]],
  10: [346, 26, [[4, 43], [1, 44]]]
};

const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
};

const dataCapacity = (version) =>
  VERSIONS[version][2].reduce((sum, [count, per]) => sum + count * per, 0);

/* --- GF(256) arithmetic -------------------------------------------------- */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function generatorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function ecBytes(data, ecLength) {
  const gen = generatorPoly(ecLength);
  const buffer = [...data, ...new Array(ecLength).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = buffer[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j++) buffer[i + j] ^= gfMul(gen[j], factor);
  }
  return buffer.slice(data.length);
}

/* --- Bit stream ---------------------------------------------------------- */
class Bits {
  constructor() { this.bits = []; }
  push(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >> i) & 1);
  }
  get length() { return this.bits.length; }
  toBytes() {
    const bytes = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] || 0);
      bytes.push(byte);
    }
    return bytes;
  }
}

/* --- Encode -------------------------------------------------------------- */
function encodeData(text) {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const countBits = v < 10 ? 8 : 16;
    const capacityBits = dataCapacity(v) * 8;
    if (4 + countBits + bytes.length * 8 <= capacityBits) { version = v; break; }
  }
  if (!version) throw new Error('Text is too long for a version-10 QR code.');

  const countBits = version < 10 ? 8 : 16;
  const stream = new Bits();
  stream.push(0b0100, 4);              // byte mode
  stream.push(bytes.length, countBits);
  bytes.forEach((b) => stream.push(b, 8));

  const capacityBits = dataCapacity(version) * 8;
  stream.push(0, Math.min(4, capacityBits - stream.length));       // terminator
  while (stream.length % 8) stream.push(0, 1);                     // byte align

  const words = stream.toBytes();
  const pads = [0xec, 0x11];
  let i = 0;
  while (words.length < dataCapacity(version)) words.push(pads[i++ % 2]);

  return { version, words };
}

/** Split into blocks, RS-encode each, then interleave. */
function interleave(version, words) {
  const [, ecPerBlock, layout] = VERSIONS[version];
  const dataBlocks = [];
  const ecBlocks = [];
  let cursor = 0;
  for (const [count, per] of layout) {
    for (let b = 0; b < count; b++) {
      const chunk = words.slice(cursor, cursor + per);
      cursor += per;
      dataBlocks.push(chunk);
      ecBlocks.push(ecBytes(chunk, ecPerBlock));
    }
  }
  const out = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

/* --- Matrix -------------------------------------------------------------- */
function blankMatrix(size) {
  return {
    size,
    cells: Array.from({ length: size }, () => new Int8Array(size).fill(-1)),
    reserved: Array.from({ length: size }, () => new Uint8Array(size))
  };
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= m.size || cc >= m.size) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                     (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m.cells[rr][cc] = inRing || inCore ? 1 : 0;
      m.reserved[rr][cc] = 1;
    }
  }
}

function placeAlignment(m, version) {
  const centers = ALIGN[version];
  for (const r of centers) {
    for (const c of centers) {
      // skip the three finder corners
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= m.size - 9) || (r >= m.size - 9 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          m.cells[r + dr][c + dc] = on ? 1 : 0;
          m.reserved[r + dr][c + dc] = 1;
        }
      }
    }
  }
}

function reserveFormat(m, version) {
  // Row 8 and column 8 hold the format bits, except index 6 which belongs to
  // the timing patterns and must stay timing.
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) { m.reserved[8][i] = 1; m.reserved[i][8] = 1; }
  }
  for (let i = 0; i < 8; i++) {
    m.reserved[8][m.size - 1 - i] = 1;
    m.reserved[m.size - 1 - i][8] = 1;
  }
  m.reserved[m.size - 8][8] = 1;         // always-dark module, written with the format bits
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m.reserved[i][m.size - 11 + j] = 1;
        m.reserved[m.size - 11 + j][i] = 1;
      }
    }
  }
}

function placeTiming(m) {
  for (let i = 8; i < m.size - 8; i++) {
    const on = i % 2 === 0 ? 1 : 0;
    if (!m.reserved[6][i]) { m.cells[6][i] = on; m.reserved[6][i] = 1; }
    if (!m.reserved[i][6]) { m.cells[i][6] = on; m.reserved[i][6] = 1; }
  }
}

function placeData(m, bytes) {
  const bits = [];
  bytes.forEach((b) => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
  let index = 0;
  let upward = true;
  for (let right = m.size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5;                       // skip the vertical timing column
    for (let step = 0; step < m.size; step++) {
      const row = upward ? m.size - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (m.reserved[row][col]) continue;
        m.cells[row][col] = index < bits.length ? bits[index] : 0;
        index++;
      }
    }
    upward = !upward;
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function applyMask(m, maskIndex) {
  const out = blankMatrix(m.size);
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      out.reserved[r][c] = m.reserved[r][c];
      // Cells still at -1 are format/version slots. They score as light,
      // matching how every mainstream encoder evaluates masks.
      const value = m.cells[r][c] < 0 ? 0 : m.cells[r][c];
      out.cells[r][c] = m.reserved[r][c] ? value : value ^ (MASKS[maskIndex](r, c) ? 1 : 0);
    }
  }
  return out;
}

function bchFormat(data) {
  let value = data << 10;
  for (let i = 14; i >= 10; i--) if ((value >> i) & 1) value ^= 0x537 << (i - 10);
  return ((data << 10) | value) ^ 0x5412;
}

function bchVersion(version) {
  let value = version << 12;
  for (let i = 17; i >= 12; i--) if ((value >> i) & 1) value ^= 0x1f25 << (i - 12);
  return (version << 12) | value;
}

function writeFormat(m, maskIndex) {
  const bits = bchFormat((0b00 << 3) | maskIndex);   // 00 = level M
  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;

    // Copy one runs down column 8, then continues at the bottom-left.
    if (i < 6) m.cells[i][8] = bit;
    else if (i < 8) m.cells[i + 1][8] = bit;
    else m.cells[m.size - 15 + i][8] = bit;

    // Copy two runs along row 8, from the top-right back towards the corner.
    if (i < 8) m.cells[8][m.size - 1 - i] = bit;
    else if (i === 8) m.cells[8][7] = bit;
    else m.cells[8][14 - i] = bit;
  }
  m.cells[m.size - 8][8] = 1;   // the always-dark module
}

function writeVersion(m, version) {
  if (version < 7) return;
  const bits = bchVersion(version);
  for (let i = 0; i < 18; i++) {
    const bit = (bits >> i) & 1;
    const r = Math.floor(i / 3);
    const c = i % 3;
    m.cells[r][m.size - 11 + c] = bit;
    m.cells[m.size - 11 + c][r] = bit;
  }
}

function penalty(m) {
  const n = m.size;
  let score = 0;

  // Rule 1 — runs of five or more
  for (let i = 0; i < n; i++) {
    for (const readRow of [true, false]) {
      let run = 1;
      let prev = readRow ? m.cells[i][0] : m.cells[0][i];
      for (let j = 1; j < n; j++) {
        const cur = readRow ? m.cells[i][j] : m.cells[j][i];
        if (cur === prev) { run++; } else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = cur; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }

  // Rule 2 — 2×2 blocks
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = m.cells[r][c];
      if (v === m.cells[r][c + 1] && v === m.cells[r + 1][c] && v === m.cells[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 3 — finder-like patterns
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (get, i) => {
    let a = true;
    let b = true;
    for (let k = 0; k < 11; k++) {
      const v = get(i + k);
      if (v !== A[k]) a = false;
      if (v !== B[k]) b = false;
    }
    return a || b;
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= n - 11; j++) {
      if (matches((k) => m.cells[i][k], j)) score += 40;
      if (matches((k) => m.cells[k][i], j)) score += 40;
    }
  }

  // Rule 4 — dark/light balance
  let dark = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) dark += m.cells[r][c];
  const percent = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * @param {string} text
 * @returns {{size:number, modules:number[][], version:number}}
 */
export function encodeQR(text) {
  const { version, words } = encodeData(text);
  const codewords = interleave(version, words);
  const size = 17 + version * 4;

  const base = blankMatrix(size);
  placeFinder(base, 0, 0);
  placeFinder(base, 0, size - 7);
  placeFinder(base, size - 7, 0);
  placeAlignment(base, version);
  reserveFormat(base, version);
  placeTiming(base);
  placeData(base, codewords);

  // Masks are scored before the format bits go in, which is what the reference
  // encoders do; then the winner gets its real format and version blocks.
  let best = null;
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = applyMask(base, mask);
    const score = penalty(candidate);
    if (score < bestScore) { bestScore = score; bestMask = mask; best = candidate; }
  }
  writeFormat(best, bestMask);
  writeVersion(best, version);

  return { size, version, mask: bestMask, modules: best.cells.map((row) => Array.from(row)) };
}

/**
 * Render as an SVG string. Quiet zone of 4 modules is part of the spec —
 * scanners need it.
 */
export function qrSvg(text, { scale = 8, quiet = 4, dark = '#000000', light = '#ffffff' } = {}) {
  const { size, modules } = encodeQR(text);
  const total = (size + quiet * 2) * scale;
  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        path += `M${(c + quiet) * scale} ${(r + quiet) * scale}h${scale}v${scale}h-${scale}z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
    `<rect width="${total}" height="${total}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/></svg>`;
}

/** PNG data URL, for downloading a printable code. */
export function qrPngDataUrl(text, { scale = 10, quiet = 4 } = {}) {
  const { size, modules } = encodeQR(text);
  const total = (size + quiet * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = total;
  canvas.height = total;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, total, total);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
  return canvas.toDataURL('image/png');
}
