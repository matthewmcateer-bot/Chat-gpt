import fs from 'node:fs';
import wavefile from 'wavefile';
const {WaveFile}=wavefile;
const src='D:\\Samples\\Sample Magic - Ambient Textures 2\\loops\\atmospheres_&_drones\\at2_70_drone_loop_choir_Gmin.wav';
const w=new WaveFile(fs.readFileSync(src));
const c=w.getSamples(false,Float64Array);
const l=Array.isArray(c)?c[0]:c,r=Array.isArray(c)?c[1]:null;
const sr=w.fmt.sampleRate, mono=new Float64Array(l.length);
for(let i=0;i<l.length;i++) mono[i]=r?(l[i]+r[i])*.5:l[i];
const rows=[];
for(let start=0;start+5<=mono.length/sr;start+=.5){
 let sum=0,peak=0,diff=0,first=Math.round(start*sr),end=first+5*sr;
 for(let i=first;i<end;i++){const x=mono[i];sum+=x*x;peak=Math.max(peak,Math.abs(x));
   if(i>first)diff+=Math.abs(x-mono[i-1]);}
 rows.push({start,finish:start+5,rms:Math.sqrt(sum/(end-first)),peak,
   crest:peak/Math.sqrt(sum/(end-first)),meanDiff:diff/(end-first-1)});
}
rows.sort((a,b)=>a.crest-b.crest||b.rms-a.rms);
console.log(JSON.stringify(rows.slice(0,12),null,2));
