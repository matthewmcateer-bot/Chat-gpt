import fs from 'node:fs';
import path from 'node:path';
import Tracker,{PatternFX} from '@polyend/tracker-lib';

const project='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const work='C:\\Users\\matth\\Documents\\TrackerDroneBuilder';
const build=path.join(work,'output','E_MINOR_GRAIN_DRONE_MIDI_V1');
const patDir=path.join(build,'patterns');
const backup=path.join(work,'backups','E_MINOR_GRAIN_DRONE_COMPACT_V2_PRE_MIDI');
if(fs.existsSync(build)) throw Error('Build already exists: '+build);
fs.mkdirSync(patDir,{recursive:true});
if(!fs.existsSync(backup)) fs.cpSync(project,backup,{recursive:true});

const CHORD={
 Sus2:0,Min:3,Maj:4,Open5:10,Stack5:11,
 Min7:19,Maj6:21,Dom7:22,Maj7:23
};
const chordLabels=[
 '027','028','036','037','047','048','057','05A','05C','067','07C','07E',
 '0279','027A','027B','0369','036A','0378','0379','037A','037B','0479',
 '047A','047B','0489','048A','048B','057A','057B'
];
const progressions=[
 {name:'E HOME',chords:[[52,'Open5',68],[50,'Open5',54],[48,'Maj7',62],[47,'Dom7',58]]},
 {name:'F# VEIL',chords:[[54,'Open5',58],[52,'Open5',48],[50,'Maj',64],[47,'Dom7',52]]},
 {name:'G MEMORY',chords:[[43,'Maj6',62],[54,'Open5',50],[52,'Min7',66],[50,'Open5',48]]},
 {name:'A LIFT',chords:[[45,'Min7',60],[45,'Maj',52],[43,'Open5',64],[47,'Dom7',55]]},
 {name:'B SIGNAL',chords:[[47,'Stack5',66],[45,'Open5',50],[43,'Maj6',61],[42,'Open5',46]]},
 {name:'C FADE',chords:[[48,'Min',48],[48,'Maj7',64],[45,'Min7',54],[43,'Open5',58]]},
 {name:'D RETURN',chords:[[50,'Stack5',64],[48,'Open5',49],[47,'Dom7',60],[45,'Open5',52]]},
 {name:'E GHOST',chords:[[52,'Min',58],[52,'Maj',48],[48,'Maj7',65],[47,'Dom7',54]]}
];
const flourishes=[
 [[7,71,48,44],[27,74,44,61],[43,76,56,52],[59,78,36,38]],
 [[11,66,54,42],[25,69,42,58],[39,71,62,49],[55,74,34,40]],
 [[5,67,58,46],[21,71,45,62],[37,74,52,50],[58,76,38,42]],
 [[9,69,48,52],[29,71,62,44],[45,72,40,58],[57,76,34,38]],
 [[6,71,64,50],[23,74,44,60],[41,76,52,48],[60,78,36,42]],
 [[13,72,46,44],[31,71,58,54],[47,67,42,48],[61,64,32,36]],
 [[8,74,58,50],[26,78,40,58],[42,76,54,46],[57,71,34,39]],
 [[7,76,64,52],[24,74,46,58],[40,71,56,44],[59,68,30,35]]
];
function setFx(step,slot,typeIndex,value){
 step.fx[slot]={type:PatternFX[typeIndex],value};
}
const originalAudio=[];
const arrangement=[];
for(let index=0;index<8;index++){
 const id=String(index+1).padStart(2,'0');
 const src=path.join(project,'patterns','pattern_'+id+'.mtp');
 const pattern=await Tracker.readPattern(src);
 if(!pattern||pattern.trackCount!==12) throw Error('Invalid pattern '+id);
 originalAudio[index]=JSON.stringify(pattern.tracks.slice(0,8));
 const chordTrack=pattern.tracks[8];
 const flourishTrack=pattern.tracks[9];
 for(const track of [chordTrack,flourishTrack])
  for(const step of track.steps){
   step.note=-1;step.instrument=0;
   setFx(step,0,0,0);setFx(step,1,0,0);
  }
 const rows=[0,16,32,48],usedChords=[];
 progressions[index].chords.forEach(([note,quality,velocity],n)=>{
  const step=chordTrack.steps[rows[n]];
  step.note=note;step.instrument=48;
  setFx(step,0,14,CHORD[quality]);
  setFx(step,1,18,velocity);
  usedChords.push({row:rows[n],root:note,quality,
   formula:chordLabels[CHORD[quality]],velocity});
 });
 const usedFlourishes=[];
 for(const [row,note,chance,velocity] of flourishes[index]){
  const step=flourishTrack.steps[row];
  step.note=note;step.instrument=49;
  setFx(step,0,4,chance);
  setFx(step,1,18,velocity);
  usedFlourishes.push({row,note,chance,velocity});
 }
 if(JSON.stringify(pattern.tracks.slice(0,8))!==originalAudio[index])
  throw Error('Audio tracks changed before write');
 const out=path.join(patDir,'pattern_'+id+'.mtp');
 await Tracker.writePattern(pattern,out);
 const reread=await Tracker.readPattern(out);
 if(JSON.stringify(reread.tracks.slice(0,8))!==originalAudio[index])
  throw Error('Audio tracks changed in serialization: '+id);
 arrangement.push({pattern:index+1,name:progressions[index].name,
  chords:usedChords,flourishes:usedFlourishes});
}

const metadata=Tracker.createPatternsMetadata(
 progressions.map(p=>p.name)
);
const oldCwd=process.cwd();
process.chdir(patDir);
await Tracker.writePatternsMetadata(metadata);
process.chdir(oldCwd);
const p=await Tracker.readProject(path.join(project,'project.mt'));
if(!p) throw Error('Could not read project');
p.values.trackNames[8]='DM CHORD';
p.values.trackNames[9]='0C GHOST';
p.values.trackNames[10]='MIDI AUX';
p.values.trackNames[11]='MIDI AUX';
process.chdir(build);
await Tracker.writeProject(p);
process.chdir(oldCwd);

for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 fs.copyFileSync(
  path.join(patDir,'pattern_'+id+'.mtp'),
  path.join(project,'patterns','pattern_'+id+'.mtp')
 );
}
fs.copyFileSync(
 path.join(patDir,'patternsMetadata'),
 path.join(project,'patterns','patternsMetadata')
);
fs.copyFileSync(path.join(build,'project.mt'),path.join(project,'project.mt'));
const validation=[];
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 const pattern=await Tracker.readPattern(
  path.join(project,'patterns','pattern_'+id+'.mtp')
 );
 if(!pattern||JSON.stringify(pattern.tracks.slice(0,8))!==originalAudio[n-1])
  throw Error('Final audio-track validation failed: '+id);
 const chordSteps=pattern.tracks[8].steps
  .map((s,row)=>({row,...s})).filter(s=>s.note>=0);
 const flourishSteps=pattern.tracks[9].steps
  .map((s,row)=>({row,...s})).filter(s=>s.note>=0);
 if(chordSteps.length!==4||chordSteps.some(s=>s.instrument!==48||
    !s.fx.some(f=>f.type.index===14)))
  throw Error('DeepMind validation failed: '+id);
 if(flourishSteps.length!==flourishes[n-1].length||
    flourishSteps.some(s=>s.instrument!==49||
     !s.fx.some(f=>f.type.index===4)))
  throw Error('0-Coast validation failed: '+id);
 validation.push({pattern:n,chordEvents:chordSteps.length,
  flourishEvents:flourishSteps.length});
}
const finalMeta=await Tracker.readPatternsMetadata(
 path.join(project,'patterns','patternsMetadata')
);
const finalProject=await Tracker.readProject(path.join(project,'project.mt'));
if(!finalMeta||finalMeta.patternNames.slice(0,8)
 .join('|')!==progressions.map(p=>p.name).join('|'))
 throw Error('Metadata validation failed');
const report={
 status:'PASS',deepmind:{midiInstrument:'M01',midiChannel:1,track:9,
  method:'MIDI Chord FX plus velocity',eventsPerPattern:4},
 zeroCoast:{midiInstrument:'M02',midiChannel:2,track:10,
  method:'probability plus velocity',eventsPerPattern:'4 sparse notes'},
 patternNames:finalMeta.patternNames.slice(0,8),
 trackNames:finalProject.values.trackNames.slice(8,12),
 arrangement,validation,workspaceChanged:false,backup
};
fs.writeFileSync(path.join(work,'midi-arrangement-report.json'),
 JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
