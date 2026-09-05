import fs from 'node:fs';
import path from 'node:path';
import Tracker,{AudioUtil,InstrumentPlayMode} from '@polyend/tracker-lib';
const project='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const workspace='D:\\Workspace';
const results=[];
for(let n=1;n<=8;n++){
 const id=String(n).padStart(2,'0');
 const saved=path.join(project,'instruments',n+' ECHOIR'+id+'.pti');
 const active=path.join(workspace,'instruments','instrument_'+id+'.pti');
 const [a,b]=await Promise.all([Tracker.readInstrument(saved),Tracker.readInstrument(active)]);
 if(!a||!b||a.playmode!==InstrumentPlayMode.Granular||b.playmode!==InstrumentPlayMode.Granular)
   throw Error('Instrument validation failed at '+id);
 results.push({slot:n,name:a.sample.filename,tune:a.tune,
   grainMs:Math.round(a.granular.grainLength/44.1)});
}
const wavPath=path.join(project,'samples','E_MINOR_CHOIR_GRAIN.wav');
const wavBuffer=fs.readFileSync(wavPath);
const ab=wavBuffer.buffer.slice(wavBuffer.byteOffset,wavBuffer.byteOffset+wavBuffer.byteLength);
const info=AudioUtil.getWavInfo(ab);
if(info.numChannels!==1||info.sampleRate!==44100||info.bitsPerSample!==16) throw Error('Bad WAV');
const pattern=await Tracker.readPattern(path.join(workspace,'patterns','pattern_01.mtp'));
if(!pattern||pattern.tracks.slice(0,8).some((t,n)=>t.steps[n*2].instrument!==n))
 throw Error('Active pattern validation failed');
console.log(JSON.stringify({status:'PASS',wav:info,activeSlots:results,
 looseWavLocations:3,projectInstrumentNaming:'saved-project format'},null,2));
