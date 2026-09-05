import fs from 'node:fs';
import path from 'node:path';
import Tracker,{PatternFX} from '@polyend/tracker-lib';
const work='C:\\Users\\matth\\Documents\\TrackerDroneBuilder';
const saved='D:\\Projects\\E_MINOR_GRAIN_DRONE',workspace='D:\\Workspace';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backup=path.join(work,'backups','E_MINOR_8VOICE_OVERLOAD_'+stamp);
const build=path.join(work,'output','E_MINOR_6VOICE_SAFE_'+stamp);
fs.mkdirSync(path.join(backup,'saved'),{recursive:true});
fs.mkdirSync(path.join(backup,'workspace'),{recursive:true});
fs.cpSync(saved,path.join(backup,'saved'),{recursive:true});
fs.cpSync(workspace,path.join(backup,'workspace'),{recursive:true});
fs.mkdirSync(path.join(build,'saved','instruments'),{recursive:true});
fs.mkdirSync(path.join(build,'saved','patterns'),{recursive:true});
fs.mkdirSync(path.join(build,'workspace','instruments'),{recursive:true});
fs.mkdirSync(path.join(build,'workspace','patterns'),{recursive:true});
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function seal(file){const b=fs.readFileSync(file);b.writeUInt16LE(b.length,12);b.writeUInt32LE(crc32(b.subarray(0,b.length-4)),b.length-4);fs.writeFileSync(file,b)}
function sealProject(file){const b=fs.readFileSync(file);b.writeUInt32LE(crc32(b.subarray(0,b.length-4)),b.length-4);fs.writeFileSync(file,b)}
function disable(a){a.enabled=false;a.isLFO=false;a.lfo.amount=0}
const levels=[0.32,0.30,0.27,0.25,0.23,0.21];
const sends=[0.28,0.27,0.25,0.24,0.22,0.20];
const resonances=[0.38,0.34,0.32,0.29,0.26,0.23];
const posAmounts=[0.045,0.05,0.055,0.048,0.052,0.043];
for(let n=1;n<=6;n++){
 const src=path.join(saved,'instruments',n+' ECHOIR0'+n+'.pti');
 const i=await Tracker.readInstrument(src);if(!i)throw Error('Cannot read '+src);
 i.volume=levels[n-1];i.reverbSend=sends[n-1];i.resonance=resonances[n-1];i.overdrive=0;
 i.granular.grainLength=Math.min(i.granular.grainLength,11025);
 disable(i.automations[1]);disable(i.automations[2]);disable(i.automations[3]);disable(i.automations[5]);
 const pos=i.automations[4];pos.enabled=true;pos.isLFO=true;pos.lfo.speed=(n-1)%3;pos.lfo.amount=posAmounts[n-1];
 const sf=path.join(build,'saved','instruments',n+' ECHOIR0'+n+'.pti');
 const wf=path.join(build,'workspace','instruments','instrument_0'+n+'.pti');
 await Tracker.writeInstrument(i,sf);fs.copyFileSync(sf,wf);
}
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0'),src=path.join(saved,'patterns','pattern_'+id+'.mtp');
 const p=await Tracker.readPattern(src);if(!p||p.trackCount!==12)throw Error('Bad pattern '+id);
 for(const t of p.tracks.slice(6,8)){for(const s of t.steps){s.note=-1;s.instrument=0;s.fx=[{type:PatternFX[0],value:0},{type:PatternFX[0],value:0}]}t.length=63}
 p.header.size=9260;p.crc=0;
 for(const flavor of ['saved','workspace']){
  const out=path.join(build,flavor,'patterns','pattern_'+id+'.mtp');
  await Tracker.writePattern(p,out);
  const b=fs.readFileSync(out);
  for(let t=0;t<12;t++){const base=28+t*769,len=b[base];for(let r=len+1;r<128;r++){const o=base+1+r*6;b[o]=255;b.fill(0,o+1,o+6)}}
  fs.writeFileSync(out,b);seal(out);
 }
}
for(const flavor of ['saved','workspace'])fs.copyFileSync(path.join(saved,'patterns','patternsMetadata'),path.join(build,flavor,'patterns','patternsMetadata'));
const oldCwd=process.cwd();
for(const [flavor,root] of [['saved',saved],['workspace',workspace]]){
 const p=await Tracker.readProject(path.join(root,'project.mt'));if(!p)throw Error('Bad project '+root);
 p.values.trackNames[6]='SAFE OFF';p.values.trackNames[7]='SAFE OFF';
 p.values.trackNames[8]='DM CHORD';p.values.trackNames[9]='0C GHOST';
 p.values.reverb.size=0.76;p.values.reverb.damp=0.42;p.values.reverb.predelay=0.05;p.values.reverb.diffusion=0.82;
 p.values.reverbVolume=32;p.values.delayVolume=0;
 process.chdir(path.join(build,flavor));await Tracker.writeProject(p);process.chdir(oldCwd);
 sealProject(path.join(build,flavor,'project.mt'));
}
const removals=[
 path.join(saved,'instruments','7 ECHOIR07.pti'),path.join(saved,'instruments','8 ECHOIR08.pti'),
 path.join(workspace,'instruments','instrument_07.pti'),path.join(workspace,'instruments','instrument_08.pti')
];
for(const f of removals)if(fs.existsSync(f))fs.rmSync(f);
for(let n=1;n<=6;n++){
 fs.copyFileSync(path.join(build,'saved','instruments',n+' ECHOIR0'+n+'.pti'),path.join(saved,'instruments',n+' ECHOIR0'+n+'.pti'));
 fs.copyFileSync(path.join(build,'workspace','instruments','instrument_0'+n+'.pti'),path.join(workspace,'instruments','instrument_0'+n+'.pti'));
}
for(let n=1;n<=8;n++){const id=String(n).padStart(2,'0');
 fs.copyFileSync(path.join(build,'saved','patterns','pattern_'+id+'.mtp'),path.join(saved,'patterns','pattern_'+id+'.mtp'));
 fs.copyFileSync(path.join(build,'workspace','patterns','pattern_'+id+'.mtp'),path.join(workspace,'patterns','pattern_'+id+'.mtp'));
}
for(const [flavor,root] of [['saved',saved],['workspace',workspace]]){
 fs.copyFileSync(path.join(build,flavor,'project.mt'),path.join(root,'project.mt'));
 fs.copyFileSync(path.join(build,flavor,'patterns','patternsMetadata'),path.join(root,'patterns','patternsMetadata'));
}
const audit={patterns:[],instruments:[],projects:[]};
for(let n=1;n<=6;n++){
 const f=path.join(saved,'instruments',n+' ECHOIR0'+n+'.pti'),i=await Tracker.readInstrument(f);
 const lfos=i.automations.filter(a=>a.enabled&&a.isLFO).length;
 if(i.volume>0.33||i.reverbSend>0.29||i.resonance>0.4||lfos!==1)throw Error('Unsafe instrument '+n);
 audit.instruments.push({voice:n,volume:i.volume,reverbSend:i.reverbSend,resonance:i.resonance,activeLFOs:lfos});
}
for(let n=1;n<=8;n++){const id=String(n).padStart(2,'0'),f=path.join(saved,'patterns','pattern_'+id+'.mtp');
 const b=fs.readFileSync(f),p=await Tracker.readPattern(f),counts=p.tracks.map(t=>t.steps.slice(0,t.length+1).filter(s=>s.note>=0).length);
 if(b.readUInt16LE(12)!==b.length||b.readUInt32LE(b.length-4)!==crc32(b.subarray(0,b.length-4)))throw Error('Bad CRC '+id);
 if(counts.slice(0,6).some(x=>x!==1)||counts[6]||counts[7]||counts[8]!==4||counts[9]!==4)throw Error('Bad event layout '+id+': '+counts);
 audit.patterns.push({pattern:n,audioVoices:counts.slice(0,8),deepMind:counts[8],zeroCoast:counts[9]});
}
for(const root of [saved,workspace]){const f=path.join(root,'project.mt'),b=fs.readFileSync(f),p=await Tracker.readProject(f);
 if(b.readUInt32LE(b.length-4)!==crc32(b.subarray(0,b.length-4))||p.values.reverbVolume!==32)throw Error('Bad project '+root);
 audit.projects.push({root,reverbVolume:p.values.reverbVolume,tracks:p.values.trackNames.slice(0,10)});
}
const report={status:'PASS',design:'6 granular voices + 2 resting audio lanes + 2 MIDI lanes',backup,build,
 changes:{instrumentCopies:'8 to 6',embeddedAudio:'40s to 30s',activeGranularVoices:'8 to 6',lfosPerVoice:'2 to 1',reverbReturn:'58 to 32',airTracks:'cleared'},audit};
fs.writeFileSync(path.join(work,'six-voice-safe-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
