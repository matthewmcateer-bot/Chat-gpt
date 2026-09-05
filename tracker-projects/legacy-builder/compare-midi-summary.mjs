import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Tracker from '@polyend/tracker-lib';
const roots={saved:'D:\\Projects\\E_MINOR_GRAIN_DRONE',loaded:'D:\\Workspace'};
for(const [kind,root] of Object.entries(roots)){
 console.log(kind.toUpperCase());
 for(let p=1;p<=8;p++){
  const id=String(p).padStart(2,'0');
  const file=path.join(root,'patterns','pattern_'+id+'.mtp');
  const b=fs.readFileSync(file);
  const x=await Tracker.readPattern(file);
  const sig=[8,9].map(t=>{
   const ev=x.tracks[t].steps.slice(0,x.tracks[t].length+1)
    .map((s,row)=>s.note!==-1?row+':'+s.note+'/'+s.instrument+'/'+s.fx.map(f=>f.type.index+'='+f.value).join(','):null)
    .filter(Boolean);
   return 'T'+(t+1)+'['+ev.join(';')+']';
  }).join(' ');
  console.log('P'+p,'bytes='+b.length,'sha='+crypto.createHash('sha256').update(b).digest('hex').slice(0,12),'tracks='+x.trackCount,sig);
 }
}