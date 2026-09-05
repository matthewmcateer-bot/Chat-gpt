import fs from 'node:fs';
import path from 'node:path';
const roots=['D:\\Instruments\\Instruments\\Aisjam FM Lite'];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){const r=walk(p);if(r)return r}else if(e.name.endsWith('.mtp'))return p}}
const f=walk(roots[0]),b=fs.readFileSync(f);
console.log({file:f,hex:b.subarray(0,32).toString('hex'),tempo:b.readFloatLE(16),swing:b.readFloatLE(20),reserved:[...b.subarray(24,28)],crc:b.readUInt32LE(b.length-4)});
