import {PatternFX} from '@polyend/tracker-lib';
console.log(JSON.stringify(PatternFX.map(x=>({
 index:x.index,name:x.name,symbol:x.symbol,min:x.min,max:x.max,
 default:x.default,scaled:x.scaled
})),null,2));
