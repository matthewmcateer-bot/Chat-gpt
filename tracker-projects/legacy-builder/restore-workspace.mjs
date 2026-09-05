import fs from 'node:fs';
import path from 'node:path';
const workspace='D:\\Workspace';
const backup='C:\\Users\\matth\\Documents\\TrackerDroneBuilder\\backups\\E_MINOR_GRAIN_DRONE_SLUGGISH_V1\\workspace';
for(let n=1;n<=8;n++){
 const file=path.join(workspace,'instruments','instrument_'+String(n).padStart(2,'0')+'.pti');
 if(fs.existsSync(file)) fs.unlinkSync(file);
}
const addedWav=path.join(workspace,'samples','E_MINOR_CHOIR_GRAIN.wav');
if(fs.existsSync(addedWav)) fs.unlinkSync(addedWav);
for(const rel of ['project.mt','patterns\\pattern_01.mtp','patterns\\patternsMetadata',
 'instruments\\instrument_03.pti']){
 const src=path.join(backup,rel),dst=path.join(workspace,rel);
 if(fs.existsSync(src)){fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);}
}
console.log(JSON.stringify({status:'RESTORED',workspaceFiles:{
 instruments:fs.readdirSync(path.join(workspace,'instruments')),
 patterns:fs.readdirSync(path.join(workspace,'patterns')),
 samples:fs.readdirSync(path.join(workspace,'samples'))}},null,2));
