// Run: node novel-reader/icons/generate-icons.js
// Generates minimal valid PNG icons for the PWA manifest.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(size) {
  // Build raw image data (RGB)
  const rawData = Buffer.alloc((size * size * 3) + size);
  const gold = [0xC9, 0xA9, 0x6E];
  const white = [0xFF, 0xFF, 0xFF];
  const darkGold = [0x8B, 0x69, 0x14];

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    rawData[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      const inBook = x >= size * 0.25 && x <= size * 0.75 &&
                     y >= size * 0.2 && y <= size * 0.8;
      const inSpine = x >= size * 0.22 && x <= size * 0.28 &&
                      y >= size * 0.2 && y <= size * 0.8;
      if (inSpine) { rawData[px] = darkGold[0]; rawData[px+1] = darkGold[1]; rawData[px+2] = darkGold[2]; }
      else if (inBook) { rawData[px] = white[0]; rawData[px+1] = white[1]; rawData[px+2] = white[2]; }
      else { rawData[px] = gold[0]; rawData[px+1] = gold[1]; rawData[px+2] = gold[2]; }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } table[n] = c; }
    c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) { c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  const chunks = [];
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  chunks.push(sig);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  chunks.push(chunk('IHDR', ihdr));
  chunks.push(chunk('IDAT', deflated));
  chunks.push(chunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'icon-192.png'), makePNG(192));
fs.writeFileSync(path.join(dir, 'icon-512.png'), makePNG(512));
console.log('Icons generated: icon-192.png, icon-512.png');
