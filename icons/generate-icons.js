'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const sizes = [16, 32, 48, 128];
const outputDirectory = __dirname;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createPng(size) {
  const background = [49, 93, 76, 255];
  const foreground = [244, 241, 233, 255];
  const pixels = Buffer.alloc(size * size * 4);

  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (y * size + x) * 4;
    pixels.set(color, offset);
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(x, y, background);
  }

  const stroke = Math.max(1, Math.round(size / 12));
  const padding = Math.round(size * 0.2);
  const edge = size - padding - 1;
  const arm = Math.max(2, Math.round(size * 0.18));
  const line = (x1, y1, x2, y2) => {
    const horizontal = y1 === y2;
    const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let step = 0; step <= length; step += 1) {
      const x = horizontal ? Math.min(x1, x2) + step : x1;
      const y = horizontal ? y1 : Math.min(y1, y2) + step;
      for (let offset = -Math.floor(stroke / 2); offset <= Math.floor(stroke / 2); offset += 1) {
        setPixel(horizontal ? x : x + offset, horizontal ? y + offset : y, foreground);
      }
    }
  };

  line(padding, padding, padding + arm, padding);
  line(padding, padding, padding, padding + arm);
  line(edge - arm, padding, edge, padding);
  line(edge, padding, edge, padding + arm);
  line(padding, edge, padding + arm, edge);
  line(padding, edge - arm, padding, edge);
  line(edge - arm, edge, edge, edge);
  line(edge, edge - arm, edge, edge);

  const center = Math.floor(size / 2);
  const cross = Math.max(1, Math.round(size * 0.13));
  line(center - cross, center, center + cross, center);
  line(center, center - cross, center, center + cross);

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

for (const size of sizes) {
  fs.writeFileSync(path.join(outputDirectory, `icon${size}.png`), createPng(size));
}
