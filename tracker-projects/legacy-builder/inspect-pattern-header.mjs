import fs from 'node:fs';
import Tracker from '@polyend/tracker-lib';
for(const [k,f] of Object.entries({saved:'D:\\Projects\\E_MINOR_GRAIN_DRONE\\patterns\\pattern_01.mtp',loaded:'D:\\Workspace\\patterns\\pattern_01.mtp'})){
 const p=await Tracker.readPattern(f),b=fs.readFileSync(f);
 console.log(k,{header:p.header,crc:p.crc,reserved:[...b.subarray(16,28)],tail:[...b.subarray(b.length-8)]});
}