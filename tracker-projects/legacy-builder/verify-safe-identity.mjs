import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
for(let n=1;n<=8;n++){const id=String(n).padStart(2,'0'),a=fs.readFileSync(path.join('D:\\Projects\\E_MINOR_GRAIN_DRONE\\patterns','pattern_'+id+'.mtp')),b=fs.readFileSync(path.join('D:\\Workspace\\patterns','pattern_'+id+'.mtp'));console.log(id,a.equals(b),crypto.createHash('sha256').update(a).digest('hex').slice(0,12))}
console.log('saved instruments',fs.readdirSync('D:\\Projects\\E_MINOR_GRAIN_DRONE\\instruments').filter(x=>x.endsWith('.pti')).sort());
console.log('workspace instruments',fs.readdirSync('D:\\Workspace\\instruments').filter(x=>x.endsWith('.pti')).sort());
