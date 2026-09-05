import fs from 'node:fs';
import path from 'node:path';
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){const r=walk(p);if(r)return r}else if(e.name.endsWith('.mtp'))return p}}
const f=walk('D:\\Instruments\\Instruments\\Aisjam FM Lite'),b=fs.readFileSync(f);
for(const end of [b.length-4,b.length-5])console.log({end,calc:crc32(b.subarray(0,end)),stored:b.readUInt32LE(b.length-4)});
