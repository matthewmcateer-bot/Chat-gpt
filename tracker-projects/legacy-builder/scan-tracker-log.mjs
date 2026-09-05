import fs from 'node:fs';
for(const f of ['D:\\trackerLog\\log1.ptl','D:\\trackerLog\\log2.ptl']){
 const s=fs.readFileSync(f).toString('latin1');
 const chunks=s.match(/[ -~]{6,}/g)||[];
 const hits=chunks.filter(x=>/version|firmware|midi|pattern|error|crc/i.test(x));
 console.log(f,hits.slice(-120).join('\n'));
}