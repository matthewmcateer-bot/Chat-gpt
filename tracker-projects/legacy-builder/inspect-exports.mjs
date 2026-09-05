import Tracker from '@polyend/tracker-lib';
const i=await Tracker.readInstrument('D:\\Workspace\\instruments\\instrument_10.pti');
const n=Tracker.createInstrument();
console.log('CURRENT', JSON.stringify(i,null,2));
console.log('NEW', JSON.stringify(n,null,2));
