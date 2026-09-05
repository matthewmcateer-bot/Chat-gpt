import fs from 'node:fs';
for(const f of ['D:\\trackerLog\\log1.ptl','D:\\trackerLog\\log2.ptl']){
 const s=fs.readFileSync(f).toString('latin1'),lines=s.split(/[\r\n\0]+/);
 const hits=lines.filter(x=>/\b\d+\.\d+(?:\.\d+){0,3}\b/.test(x)||/firmware|version/i.test(x));
 console.log(f,[...new Set(hits)].slice(0,200).join('\n'));
}