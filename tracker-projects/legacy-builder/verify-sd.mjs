import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Tracker, { InstrumentPlayMode } from '@polyend/tracker-lib';
const root='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const project=await Tracker.readProject(path.join(root,'project.mt'));
const metadata=await Tracker.readPatternsMetadata(path.join(root,'patterns','patternsMetadata'));
const files=[];
for(let n=1;n<=8;n++){
  const id=String(n).padStart(2,'0');
  const pti=path.join(root,'instruments','instrument_'+id+'.pti');
  const mtp=path.join(root,'patterns','pattern_'+id+'.mtp');
  const instrument=await Tracker.readInstrument(pti);
  const pattern=await Tracker.readPattern(mtp);
  if(!instrument||instrument.playmode!==InstrumentPlayMode.Granular) throw Error('Bad '+pti);
  if(!pattern||pattern.trackCount!==12) throw Error('Bad '+mtp);
  files.push({id,ptiBytes:fs.statSync(pti).size,mtpBytes:fs.statSync(mtp).size,
    ptiSha256:hash(pti),mtpSha256:hash(mtp)});
}
if(!project||project.projectName!=='E MINOR GRAIN DRONE') throw Error('Bad project');
if(!metadata||metadata.patternNames.filter(Boolean).length!==8) throw Error('Bad metadata');
console.log(JSON.stringify({status:'PASS',project:project.projectName,
  firmware:project.header.fwVersion,tempo:project.values.globalTempo,
  reverb:project.values.reverb,patternNames:metadata.patternNames.slice(0,8),
  fileCount:files.length*2+2,totalBytes:files.reduce((s,f)=>s+f.ptiBytes+f.mtpBytes,0)
    +fs.statSync(path.join(root,'project.mt')).size
    +fs.statSync(path.join(root,'patterns','patternsMetadata')).size,files},null,2));
