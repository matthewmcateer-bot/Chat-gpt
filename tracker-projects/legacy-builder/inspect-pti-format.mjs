import fs from 'node:fs';
import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){const r=walk(p);if(r)return r}else if(e.name.endsWith('.pti'))return p}}
const files=['D:\\Projects\\E_MINOR_GRAIN_DRONE\\instruments\\1 ECHOIR01.pti',walk('D:\\Instruments')];
for(const f of files){const b=fs.readFileSync(f),i=await Tracker.readInstrument(f);console.log({file:f,bytes:b.length,header:i.header,crc:i.crc,stored:b.readUInt32LE(b.length-4),calc:crc32(b.subarray(0,b.length-4)),head:b.subarray(0,24).toString('hex')})}
