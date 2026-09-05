import fs from 'node:fs';
import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(e.name.endsWith('.mtp'))out.push(p)}return out}
for(const f of walk('D:\\').filter(f=>!f.includes('E_MINOR_GRAIN_DRONE'))){
 try{
  const b=fs.readFileSync(f),p=await Tracker.readPattern(f);
  const events=p.tracks.slice(8).map((t,j)=>({track:j+9,n:t.steps.slice(0,t.length+1).filter(s=>s.note>=0).length,
   instruments:[...new Set(t.steps.filter(s=>s.note>=0).map(s=>s.instrument))]})).filter(x=>x.n);
  console.log(JSON.stringify({file:f,size:b.length,header:p.header,crc:p.crc,tracks:p.trackCount,events}));
 }catch(e){console.log(JSON.stringify({file:f,error:e.message}))}
}