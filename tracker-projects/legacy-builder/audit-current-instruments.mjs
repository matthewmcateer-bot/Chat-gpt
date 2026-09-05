import fs from 'node:fs';
import path from 'node:path';
import Tracker from '@polyend/tracker-lib';
for(const root of ['D:\\Projects\\E_MINOR_GRAIN_DRONE\\instruments','D:\\Workspace\\instruments']){
 console.log(root);
 for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.pti')).sort()){
  const i=await Tracker.readInstrument(path.join(root,f));
  console.log(JSON.stringify({file:f,active:i.isActive,playmode:i.playmode,tune:i.tune,volume:i.volume,pan:i.panning,
   grain:i.granular,cutoff:i.cutoff,resonance:i.resonance,reverb:i.reverbSend,delay:i.delaySend,overdrive:i.overdrive,
   amp:i.automations[0],panMod:i.automations[1],cutoffMod:i.automations[2],positionMod:i.automations[4]}));
 }
}