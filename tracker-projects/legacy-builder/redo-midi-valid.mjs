import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Tracker,{PatternFX} from '@polyend/tracker-lib';
const work='C:\\Users\\matth\\Documents\\TrackerDroneBuilder';
const project='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const workspace='D:\\Workspace';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backup=path.join(work,'backups','MIDI_EMPTY_V1_'+stamp);
const build=path.join(work,'output','E_MINOR_GRAIN_DRONE_MIDI_V2_'+stamp);
fs.mkdirSync(path.join(backup,'saved'),{recursive:true});
fs.mkdirSync(path.join(backup,'workspace'),{recursive:true});
fs.cpSync(project,path.join(backup,'saved'),{recursive:true});
fs.cpSync(workspace,path.join(backup,'workspace'),{recursive:true});
fs.mkdirSync(path.join(build,'patterns'),{recursive:true});
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function fx(step,slot,type,value){step.fx[slot]={type:PatternFX[type],value}}
function blank(step){step.note=-1;step.instrument=0;fx(step,0,0,0);fx(step,1,0,0)}
function finalizePattern(file){
 const b=fs.readFileSync(file);
 if(b.length!==9260)throw Error('Expected 12-track pattern: '+file);
 b.writeUInt16LE(b.length,12);
 for(let t=0;t<12;t++){const base=28+t*769,len=b[base];for(let r=len+1;r<128;r++){const o=base+1+r*6;b[o]=255;b.fill(0,o+1,o+6)}}
 b.writeUInt32LE(crc32(b.subarray(0,b.length-4)),b.length-4);
 fs.writeFileSync(file,b);
}const CH={Min:3,Maj:4,Open5:10,Stack5:11,Min7:19,Maj6:21,Dom7:22,Maj7:23};
const plans=[
 [[52,'Open5',68],[50,'Open5',54],[48,'Maj7',62],[47,'Dom7',58]],
 [[54,'Open5',58],[52,'Open5',48],[50,'Maj',64],[47,'Dom7',52]],
 [[43,'Maj6',62],[54,'Open5',50],[52,'Min7',66],[50,'Open5',48]],
 [[45,'Min7',60],[45,'Maj',52],[43,'Open5',64],[47,'Dom7',55]],
 [[47,'Stack5',66],[45,'Open5',50],[43,'Maj6',61],[42,'Open5',46]],
 [[48,'Min',48],[48,'Maj7',64],[45,'Min7',54],[43,'Open5',58]],
 [[50,'Stack5',64],[48,'Open5',49],[47,'Dom7',60],[45,'Open5',52]],
 [[52,'Min',58],[52,'Maj',48],[48,'Maj7',65],[47,'Dom7',54]]
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
const rows=[0,16,32,48],audit=[];
for(let i=0;i<8;i++){
 const id=String(i+1).padStart(2,'0'),src=path.join(project,'patterns','pattern_'+id+'.mtp');
 const p=await Tracker.readPattern(src); if(!p||p.trackCount!==12)throw Error('Bad source '+id);
 const audio=JSON.stringify(p.tracks.slice(0,8).map(t=>({length:t.length,steps:t.steps.slice(0,t.length+1)})));
 for(const t of p.tracks.slice(8,12)){t.length=63;for(const s of t.steps)blank(s)}
 plans[i].forEach(([note,chord,vel],n)=>{const s=p.tracks[8].steps[rows[n]];s.note=note;s.instrument=48;fx(s,0,14,CH[chord]);fx(s,1,18,vel)});
 flourishes[i].forEach(([row,note,chance,vel])=>{const s=p.tracks[9].steps[row];s.note=note;s.instrument=49;fx(s,0,4,chance);fx(s,1,18,vel)});
 p.header.size=9260;p.crc=0;
 const out=path.join(build,'patterns','pattern_'+id+'.mtp');await Tracker.writePattern(p,out);finalizePattern(out);
 const q=await Tracker.readPattern(out),audio2=JSON.stringify(q.tracks.slice(0,8).map(t=>({length:t.length,steps:t.steps.slice(0,t.length+1)})));
 if(audio!==audio2)throw Error('Audio changed '+id);
 const b=fs.readFileSync(out),stored=b.readUInt32LE(b.length-4),calc=crc32(b.subarray(0,b.length-4));
 const chords=q.tracks[8].steps.slice(0,64).filter(s=>s.note>=0),ghosts=q.tracks[9].steps.slice(0,64).filter(s=>s.note>=0);
 if(b.readUInt16LE(12)!==9260||stored!==calc||chords.length!==4||ghosts.length!==4)throw Error('Validation failed '+id);
 audit.push({pattern:i+1,size:b.length,crc:'0x'+stored.toString(16).toUpperCase(),chords:chords.length,flourishes:ghosts.length});
}
for(const target of [project,workspace]){
 for(let i=1;i<=8;i++){const id=String(i).padStart(2,'0');fs.copyFileSync(path.join(build,'patterns','pattern_'+id+'.mtp'),path.join(target,'patterns','pattern_'+id+'.mtp'))}
 fs.copyFileSync(path.join(project,'patterns','patternsMetadata'),path.join(target,'patterns','patternsMetadata'));
}
const projectFile=path.join(project,'project.mt'),pb=fs.readFileSync(projectFile);
pb.writeUInt32LE(crc32(pb.subarray(0,pb.length-4)),pb.length-4);fs.writeFileSync(projectFile,pb);
for(let i=1;i<=8;i++){
 const id=String(i).padStart(2,'0'),a=fs.readFileSync(path.join(project,'patterns','pattern_'+id+'.mtp')),w=fs.readFileSync(path.join(workspace,'patterns','pattern_'+id+'.mtp'));
 if(!a.equals(w))throw Error('Workspace mismatch '+id);
}
const report={status:'PASS',project,workspace,backup,build,format:{patternBytes:9260,headerSize:9260,crc32:true,unusedRows:'empty -1'},routing:{deepMind:'Track 9 / M01 / MIDI channel 1',zeroCoast:'Track 10 / M02 / MIDI channel 2'},audioTracksPreserved:8,audit};
fs.writeFileSync(path.join(work,'midi-v2-valid-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
