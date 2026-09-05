import Tracker from '@polyend/tracker-lib';
for(const [name,file] of Object.entries({saved:'D:\\Projects\\E_MINOR_GRAIN_DRONE\\project.mt',loaded:'D:\\Workspace\\project.mt'})){
 const p=await Tracker.readProject(file);
 console.log(name,JSON.stringify(p,null,2));
}