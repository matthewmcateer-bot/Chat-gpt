import fs from 'node:fs';
import path from 'node:path';
import { AudioUtil } from '@polyend/tracker-lib';

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.wav$/i.test(entry.name)) yield full;
  }
}

const root = process.argv[2] ?? 'D:\\Samples';
const matcher = new RegExp(process.argv[3] ?? '.', 'i');
const limit = Number(process.argv[4] ?? 100);
let count = 0;
for (const file of walk(root)) {
  if (!matcher.test(file)) continue;
  try {
    const raw = fs.readFileSync(file);
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const w = AudioUtil.getWavInfo(ab);
    console.log(JSON.stringify({ file, seconds: +(w.numFrames / w.sampleRate).toFixed(3), ...w, bytes: raw.length }));
    if (++count >= limit) break;
  } catch (error) {
    console.error(JSON.stringify({ file, error: error.message }));
  }
}