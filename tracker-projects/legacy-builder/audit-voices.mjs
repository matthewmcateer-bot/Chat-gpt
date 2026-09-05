import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
const root='D:\\Projects\\E_MINOR_GRAIN_DRONE';
const rows=[];
for(let n=1;n<=8;n++){
  const id=String(n).padStart(2,'0');
  const i=await Tracker.readInstrument(path.join(root,'instruments','instrument_'+id+'.pti'));
  rows.push({voice:n,tune:i.tune,volume:i.volume,pan:i.panning,
    grainMs:Math.round(i.granular.grainLength/44.1),positionPct:Math.round(i.granular.currentPosition/655.35),
    cutoff:i.cutoff,resonance:i.resonance,reverb:i.reverbSend,
    amp:{attack:i.automations[0].envelope.attack,release:i.automations[0].envelope.release},
    panLfo:i.automations[1].lfo,cutoffLfo:i.automations[2].lfo,
    positionLfo:i.automations[4].lfo,finetuneEnabled:i.automations[5].enabled});
}
const p=await Tracker.readProject(path.join(root,'project.mt'));
console.log(JSON.stringify({header:p.header,rows},null,2));
