import fs from 'node:fs';
import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
const project='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const workspace='D:\\Workspace';
const globalSamples='D:\\Samples\\E Minor Grain Drone';
fs.mkdirSync(path.join(project,'samples'),{recursive:true});
fs.mkdirSync(path.join(workspace,'instruments'),{recursive:true});
fs.mkdirSync(path.join(workspace,'samples'),{recursive:true});
fs.mkdirSync(globalSamples,{recursive:true});
for(let n=1;n<=8;n++){
  const id=String(n).padStart(2,'0');
  const oldFile=path.join(project,'instruments','instrument_'+id+'.pti');
  const savedFile=path.join(project,'instruments',n+' ECHOIR'+id+'.pti');
  if(fs.existsSync(oldFile)) fs.renameSync(oldFile,savedFile);
  if(!fs.existsSync(savedFile)) throw Error('Missing '+savedFile);
  fs.copyFileSync(savedFile,path.join(workspace,'instruments','instrument_'+id+'.pti'));
}
const first=await Tracker.readInstrument(path.join(project,'instruments','1 ECHOIR01.pti'));
if(!first) throw Error('Cannot read repaired instrument');
const wav=Buffer.from(await first.getSampleAsBlob().arrayBuffer());
for(const out of [
  path.join(project,'samples','E_MINOR_CHOIR_GRAIN.wav'),
  path.join(workspace,'samples','E_MINOR_CHOIR_GRAIN.wav'),
  path.join(globalSamples,'E_MINOR_CHOIR_GRAIN.wav')
]) fs.writeFileSync(out,wav);
console.log(JSON.stringify({status:'REPAIRED',instrumentFiles:
  fs.readdirSync(path.join(project,'instruments')),wavBytes:wav.length,
  workspaceInstruments:fs.readdirSync(path.join(workspace,'instruments'))},null,2));
