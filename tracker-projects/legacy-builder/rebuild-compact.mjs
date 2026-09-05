import fs from 'node:fs';
import path from 'node:path';
import wavefile from 'wavefile';
const {WaveFile}=wavefile;
import Tracker,{
 AudioUtil,InstrumentPlayMode,InstrumentFilterType,
 GranularShape,GranularType,LFO_SHAPE,LFO_SPEED
} from '@polyend/tracker-lib';

const source='D:\\Samples\\Sample Magic - Ambient Textures 2\\loops\\atmospheres_&_drones\\at2_70_drone_loop_choir_Gmin.wav';
const project='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const workspace='D:\\Workspace';
const work='C:\\Users\\matth\\Documents\\TrackerDroneBuilder';
const build=path.join(work,'output','E_MINOR_GRAIN_DRONE_COMPACT_V2');
const backup=path.join(work,'backups','E_MINOR_GRAIN_DRONE_SLUGGISH_V1');
const instDir=path.join(build,'instruments');
const patDir=path.join(build,'patterns');
const sampleDir=path.join(build,'samples');
if(fs.existsSync(build)) throw Error('Build already exists: '+build);
for(const d of [build,instDir,patDir,sampleDir,path.dirname(backup)])
 fs.mkdirSync(d,{recursive:true});
if(!fs.existsSync(backup)){
 fs.mkdirSync(backup,{recursive:true});
 fs.cpSync(project,path.join(backup,'project'),{recursive:true});
 fs.cpSync(workspace,path.join(backup,'workspace'),{recursive:true});
}
const input=new WaveFile(fs.readFileSync(source));
if(input.fmt.sampleRate!==44100) input.toSampleRate(44100);
const channels=input.getSamples(false,Float64Array);
const left=Array.isArray(channels)?channels[0]:channels;
const right=Array.isArray(channels)?channels[1]:null;
const sr=44100,start=Math.round(5.5*sr),frames=5*sr;
const crop=new Float32Array(frames);
let peak=0;
for(let n=0;n<frames;n++){
 crop[n]=right?(left[start+n]+right[start+n])*.5:left[start+n];
 peak=Math.max(peak,Math.abs(crop[n]));
}
if(!peak) throw Error('Selected source segment is silent');
for(let n=0;n<frames;n++) crop[n]=crop[n]/peak*.75;
const fade=Math.round(.025*sr);
for(let n=0;n<fade;n++){
 const gain=.5-.5*Math.cos(Math.PI*n/fade);
 crop[n]*=gain;
 crop[frames-1-n]*=gain;
}
const monoWav=AudioUtil.createWavFile(crop,{
 numChannels:1,sampleRate:sr,bitsPerSample:16
});
const wavName='E_MINOR_CHOIR_GRAIN.wav';
fs.writeFileSync(path.join(sampleDir,wavName),Buffer.from(monoWav));
const voices=[
 {pos:.14,ms:100,cut:.16,res:1.00,pan:-.78,vol:.85,atk:2200,rel:7000,ps:LFO_SPEED.S128,pa:.075,cs:LFO_SPEED.S96,ca:.055},
 {pos:.24,ms:125,cut:.24,res:.90,pan:.68,vol:.80,atk:3000,rel:7600,ps:LFO_SPEED.S96,pa:.085,cs:LFO_SPEED.S128,ca:.050},
 {pos:.34,ms:160,cut:.33,res:.95,pan:-.46,vol:.72,atk:3800,rel:8200,ps:LFO_SPEED.S64,pa:.095,cs:LFO_SPEED.S96,ca:.045},
 {pos:.44,ms:205,cut:.42,res:.80,pan:.36,vol:.68,atk:4600,rel:8800,ps:LFO_SPEED.S128,pa:.105,cs:LFO_SPEED.S64,ca:.040},
 {pos:.54,ms:260,cut:.53,res:.85,pan:-.25,vol:.62,atk:5400,rel:9400,ps:LFO_SPEED.S96,pa:.090,cs:LFO_SPEED.S128,ca:.038},
 {pos:.64,ms:330,cut:.63,res:.70,pan:.22,vol:.58,atk:6200,rel:10000,ps:LFO_SPEED.S64,pa:.080,cs:LFO_SPEED.S96,ca:.035},
 {pos:.73,ms:430,cut:.73,res:.60,pan:-.84,vol:.52,atk:7000,rel:10600,ps:LFO_SPEED.S128,pa:.070,cs:LFO_SPEED.S64,ca:.032},
 {pos:.82,ms:600,cut:.83,res:.50,pan:.84,vol:.48,atk:7800,rel:11200,ps:LFO_SPEED.S96,pa:.060,cs:LFO_SPEED.S128,ca:.030}
];
function lfo(a,speed,amount){
 a.enabled=true;a.isLFO=true;
 a.lfo={shape:LFO_SHAPE.Triangle,speed,amount};
}
for(let index=0;index<8;index++){
 const v=voices[index],id=String(index+1).padStart(2,'0');
 const inst=Tracker.createInstrument(monoWav.slice(0));
 inst.header.fwVersion='1.9.2.1';
 inst.sample.filename='ECHOIR'+id;
 inst.playmode=InstrumentPlayMode.Granular;
 inst.tune=-7;inst.volume=v.vol;inst.panning=v.pan;
 inst.filterEnabled=true;
 inst.filterType=InstrumentFilterType.BandPass;
 inst.cutoff=v.cut;inst.resonance=v.res;
 inst.reverbSend=.72;inst.delaySend=0;
 inst.granular={
  grainLength:Math.round(v.ms*44.1),
  currentPosition:Math.round(v.pos*65535),
  shape:GranularShape.Gauss,type:GranularType.PingPong
 };
 inst.automations[0].enabled=true;
 inst.automations[0].isLFO=false;
 inst.automations[0].envelope={
  amount:1,delay:index*180,attack:v.atk,
  decay:0,sustain:1,release:v.rel
 };
 inst.automations[1].enabled=false;
 lfo(inst.automations[2],v.cs,v.ca);
 inst.automations[3].enabled=false;
 lfo(inst.automations[4],v.ps,v.pa);
 inst.automations[5].enabled=false;
 await Tracker.writeInstrument(
  inst,path.join(instDir,(index+1)+' ECHOIR'+id+'.pti')
 );
}
fs.cpSync(path.join(project,'patterns'),patDir,{recursive:true});
const p=await Tracker.readProject(path.join(project,'project.mt'));
if(!p) throw Error('Could not read project');
p.values.globalTempo=60;
p.values.reverb={size:.92,damp:.18,predelay:.08,diffusion:.94};
p.values.reverbVolume=58;
p.values.reverbMute=0;
p.values.delayVolume=0;
const oldCwd=process.cwd();
process.chdir(build);
await Tracker.writeProject(p);
process.chdir(oldCwd);

const checks=[];
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 const file=path.join(instDir,n+' ECHOIR'+id+'.pti');
 const i=await Tracker.readInstrument(file);
 if(!i||i.playmode!==InstrumentPlayMode.Granular||i.sample.length!==frames)
  throw Error('Validation failed: '+file);
 if(i.automations[1].enabled||i.automations[5].enabled)
  throw Error('Extra LFO unexpectedly enabled: '+file);
 checks.push({slot:n,bytes:fs.statSync(file).size,volume:i.volume,
  grainMs:Math.round(i.granular.grainLength/44.1)});
}
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 const savedName=n+' ECHOIR'+id+'.pti';
 const from=path.join(instDir,savedName);
 fs.copyFileSync(from,path.join(project,'instruments',savedName));
 fs.copyFileSync(from,path.join(workspace,'instruments','instrument_'+id+'.pti'));
}
for(const out of [
 path.join(project,'samples',wavName),
 path.join(workspace,'samples',wavName),
 path.join('D:\\Samples\\E Minor Grain Drone',wavName)
]) fs.copyFileSync(path.join(sampleDir,wavName),out);
fs.copyFileSync(path.join(build,'project.mt'),path.join(project,'project.mt'));
fs.copyFileSync(path.join(build,'project.mt'),path.join(workspace,'project.mt'));

const active=[];
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 const i=await Tracker.readInstrument(
  path.join(workspace,'instruments','instrument_'+id+'.pti')
 );
 if(!i||i.sample.length!==frames) throw Error('SD readback failed: '+id);
 active.push({slot:n,frames:i.sample.length,
  positionLfo:i.automations[4].enabled,cutoffLfo:i.automations[2].enabled,
  panLfo:i.automations[1].enabled,finetuneLfo:i.automations[5].enabled});
}
const finalProject=await Tracker.readProject(path.join(workspace,'project.mt'));
const report={
 status:'PASS',sourceWindow:'5.5-10.5 seconds',normalizationPeak:.75,
 sample:AudioUtil.getWavInfo(monoWav),embeddedSeconds:frames/sr*8,
 previousEmbeddedSeconds:604800/sr*8,memoryReductionPercent:
  Math.round((1-frames/604800)*100),reverbVolume:finalProject.values.reverbVolume,
 noteDesign:'Patterns 1-8 are E F# G A B C D E; octave pairs per track.',
 modulation:'Granular position and cutoff only; static panning.',
 checks,active,backup
};
fs.writeFileSync(path.join(work,'compact-v2-report.json'),
 JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
