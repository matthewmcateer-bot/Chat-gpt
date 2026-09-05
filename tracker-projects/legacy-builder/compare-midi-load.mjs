import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
const roots={saved:'D:\\Projects\\E_MINOR_GRAIN_DRONE',loaded:'D:\\Workspace'};
const report={};
for(const [kind,root] of Object.entries(roots)){
 report[kind]=[];
 for(let p=1;p<=8;p++){
  const id=String(p).padStart(2,'0');
  const x=await Tracker.readPattern(path.join(root,'patterns','pattern_'+id+'.mtp'));
  const tracks=[8,9,10,11].map(track=>({track:track+1,length:x.tracks[track].length,
   events:x.tracks[track].steps.slice(0,x.tracks[track].length+1)
    .map((s,row)=>({row,note:s.note,instrument:s.instrument,
     fx:s.fx.map(f=>[f.type.index,f.value])}))
    .filter(s=>s.note!==-1||s.fx.some(f=>f[0]!==0))}));
  report[kind].push({pattern:p,trackCount:x.trackCount,
   structure:x.header.fileStructureVersion,tracks});
 }
}
console.log(JSON.stringify(report,null,2));
