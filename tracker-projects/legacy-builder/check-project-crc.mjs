import fs from 'node:fs';
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
for(const f of ['D:\\Projects\\E_MINOR_GRAIN_DRONE\\project.mt','D:\\Workspace\\project.mt']){
 const b=fs.readFileSync(f); console.log(f,{size:b.length,headerSize:b.readUInt16LE(12),stored:b.readUInt32LE(b.length-4),calc:crc32(b.subarray(0,b.length-4))});
}