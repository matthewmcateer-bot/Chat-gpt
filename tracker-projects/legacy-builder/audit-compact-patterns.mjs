import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
const root='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteName=n=>names[n%12]+(Math.floor(n/12)-1);
const starts=[0,2,4,6,8,10,12,14],matrix=[];
for(let p=1;p<=8;p++){
 const file=path.join(root,'patterns','pattern_'+String(p).padStart(2,'0')+'.mtp');
 const pattern=await Tracker.readPattern(file);
 const notes=pattern.tracks.slice(0,8).map((t,n)=>t.steps[starts[n]].note);
 const pitchClasses=[...new Set(notes.map(n=>n%12))];
 matrix.push({pattern:p,raw:notes,notes:notes.map(noteName),pitchClasses:pitchClasses.map(n=>names[(n+12)%12])});
}
const project=await Tracker.readProject(path.join(root,'project.mt'));
console.log(JSON.stringify({status:'PASS',matrix,tempo:project.values.globalTempo,
 reverbVolume:project.values.reverbVolume},null,2));
