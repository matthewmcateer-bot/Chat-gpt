import fs from 'node:fs';
import path from 'node:path';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;
import Tracker, {
  AudioUtil, InstrumentPlayMode, InstrumentFilterType,
  GranularShape, GranularType, LFO_SHAPE, LFO_SPEED
} from '@polyend/tracker-lib';

const source = 'D:\\Samples\\Sample Magic - Ambient Textures 2\\loops\\atmospheres_&_drones\\at2_70_drone_loop_choir_Gmin.wav';
const work = 'C:\\Users\\matth\\Documents\\TrackerDroneBuilder';
const build = path.join(work, 'output', 'E_MINOR_GRAIN_DRONE_BUILD');
const target = 'D:\\Projects\\E_MINOR_GRAIN_DRONE';
const instDir = path.join(build, 'instruments');
const patDir = path.join(build, 'patterns');
const sampleDir = path.join(build, 'samples');

if (!fs.existsSync(source)) throw new Error('Source WAV not found');
if (fs.existsSync(build)) throw new Error('Build folder already exists: ' + build);
if (fs.existsSync(target)) throw new Error('SD project already exists: ' + target);
for (const dir of [build, instDir, patDir, sampleDir])
  fs.mkdirSync(dir, { recursive: true });

const wav = new WaveFile(fs.readFileSync(source));
if (wav.fmt.sampleRate !== 44100) wav.toSampleRate(44100);
const channels = wav.getSamples(false, Float64Array);
const left = Array.isArray(channels) ? channels[0] : channels;
const right = Array.isArray(channels) ? channels[1] : null;
const mono = new Float32Array(left.length);
let peak = 0;
for (let n = 0; n < left.length; n++) {
  mono[n] = right ? (left[n] + right[n]) * 0.5 : left[n];
  peak = Math.max(peak, Math.abs(mono[n]));
}
if (!peak) throw new Error('Source WAV is silent');
for (let n = 0; n < mono.length; n++) mono[n] = mono[n] / peak * 0.5;
const monoWav = AudioUtil.createWavFile(mono, {
  numChannels: 1, sampleRate: 44100, bitsPerSample: 16
});
const info = AudioUtil.getWavInfo(monoWav);
fs.writeFileSync(path.join(sampleDir, 'E_MINOR_CHOIR_GRAIN.wav'), Buffer.from(monoWav));

const voices = [
  {pos:.18, ms:95,  cut:.18, res:1.30, pan:-.78, vol:.42, atk:3000, rel:9000,  shape:GranularShape.Gauss,    pshape:LFO_SHAPE.Triangle, ps:LFO_SPEED.S128, pa:.14, cs:LFO_SPEED.S96, ca:.08, pans:LFO_SPEED.S128, pana:.16, fine:.018},
  {pos:.27, ms:120, cut:.25, res:1.10, pan:.68,  vol:.39, atk:4200, rel:10000, shape:GranularShape.Triangle, pshape:LFO_SHAPE.RevSaw,   ps:LFO_SPEED.S96,  pa:.18, cs:LFO_SPEED.S128,ca:.06, pans:LFO_SPEED.S96,  pana:.13, fine:0},
  {pos:.36, ms:160, cut:.34, res:1.25, pan:-.48, vol:.35, atk:5400, rel:11000, shape:GranularShape.Gauss,    pshape:LFO_SHAPE.Random,   ps:LFO_SPEED.S64,  pa:.12, cs:LFO_SPEED.S96, ca:.07, pans:LFO_SPEED.S64,  pana:.11, fine:.014},
  {pos:.46, ms:210, cut:.43, res:.95,  pan:.38,  vol:.32, atk:6600, rel:12000, shape:GranularShape.Gauss,    pshape:LFO_SHAPE.Triangle, ps:LFO_SPEED.S128, pa:.20, cs:LFO_SPEED.S128,ca:.05, pans:LFO_SPEED.S128, pana:.15, fine:0},
  {pos:.57, ms:280, cut:.55, res:1.05, pan:-.28, vol:.29, atk:7800, rel:13000, shape:GranularShape.Triangle, pshape:LFO_SHAPE.Saw,      ps:LFO_SPEED.S96,  pa:.16, cs:LFO_SPEED.S64, ca:.05, pans:LFO_SPEED.S96,  pana:.10, fine:.012},
  {pos:.67, ms:360, cut:.64, res:.85,  pan:.24,  vol:.27, atk:9000, rel:14000, shape:GranularShape.Gauss,    pshape:LFO_SHAPE.RevSaw,   ps:LFO_SPEED.S64,  pa:.11, cs:LFO_SPEED.S96, ca:.04, pans:LFO_SPEED.S64,  pana:.09, fine:0},
  {pos:.77, ms:520, cut:.74, res:.70,  pan:-.86, vol:.24, atk:10200,rel:15000, shape:GranularShape.Gauss,    pshape:LFO_SHAPE.Random,   ps:LFO_SPEED.S128, pa:.09, cs:LFO_SPEED.S128,ca:.035,pans:LFO_SPEED.S128, pana:.12, fine:.010},
  {pos:.86, ms:760, cut:.84, res:.55,  pan:.86,  vol:.22, atk:11400,rel:16000, shape:GranularShape.Triangle, pshape:LFO_SHAPE.Triangle, ps:LFO_SPEED.S96,  pa:.08, cs:LFO_SPEED.S64, ca:.03, pans:LFO_SPEED.S96,  pana:.08, fine:0}
];

function setLfo(automation, shape, speed, amount) {
  automation.enabled = true;
  automation.isLFO = true;
  automation.lfo = { shape, speed, amount };
}
for (let index = 0; index < voices.length; index++) {
  const v = voices[index];
  const inst = Tracker.createInstrument(monoWav.slice(0));
  inst.header.fwVersion = '1.9.2.1';
  inst.sample.filename = 'ECHOIR' + String(index + 1).padStart(2, '0');
  inst.playmode = InstrumentPlayMode.Granular;
  inst.tune = -7;
  inst.volume = v.vol;
  inst.panning = v.pan;
  inst.filterEnabled = true;
  inst.filterType = InstrumentFilterType.BandPass;
  inst.cutoff = v.cut;
  inst.resonance = v.res;
  inst.reverbSend = .78;
  inst.delaySend = 0;
  inst.granular.grainLength = Math.round(v.ms * 44.1);
  inst.granular.currentPosition = Math.round(v.pos * 65535);
  inst.granular.shape = v.shape;
  inst.granular.type = GranularType.PingPong;

  const amp = inst.automations[0];
  amp.enabled = true;
  amp.isLFO = false;
  amp.envelope = {
    amount: 1, delay: index * 250, attack: v.atk,
    decay: 0, sustain: 1, release: v.rel
  };
  setLfo(inst.automations[1], LFO_SHAPE.Triangle, v.pans, v.pana);
  setLfo(inst.automations[2], LFO_SHAPE.Triangle, v.cs, v.ca);
  setLfo(inst.automations[4], v.pshape, v.ps, v.pa);
  if (v.fine) setLfo(inst.automations[5], LFO_SHAPE.Triangle, LFO_SPEED.S128, v.fine);

  await Tracker.writeInstrument(
    inst, path.join(instDir, String(index + 1) + ' ECHOIR' + String(index + 1).padStart(2, '0') + '.pti')
  );
}

const degrees = [0, 2, 3, 5, 7, 8, 10, 12];
const names = ['E DRONE','F# DRONE','G DRONE','A DRONE',
  'B DRONE','C DRONE','D DRONE','E HIGH'];
const baseNotes = [40, 40, 52, 52, 64, 64, 76, 76];
const starts = [0, 2, 4, 6, 8, 10, 12, 14];
for (let p = 0; p < degrees.length; p++) {
  const pattern = Tracker.createPattern(12, 64);
  pattern.header.fwVersion = [1, 9, 2, 1];
  for (let track = 0; track < 8; track++) {
    const step = pattern.tracks[track].steps[starts[track]];
    step.note = baseNotes[track] + degrees[p];
    step.instrument = track;
  }
  await Tracker.writePattern(
    pattern, path.join(patDir, 'pattern_' + String(p + 1).padStart(2, '0') + '.mtp')
  );
}

const project = await Tracker.readProject('D:\\Workspace\\project.mt');
if (!project) throw new Error('Could not parse current Tracker project template');
project.projectName = 'E MINOR GRAIN DRONE';
project.header.fwVersion = '1.9.2.255';
project.values.globalTempo = 60;
project.values.trackNames = [
  'SUB L','SUB R','BODY L','BODY R','SHIM L','SHIM R','AIR L','AIR R',
  'Midi 9','Midi 10','Midi 11','Midi 12','Midi 13','Midi 14','Midi 15','Midi 16'
];
project.values.reverb = { size:.94, damp:.16, predelay:.10, diffusion:.96 };
project.values.reverbVolume = .62;
project.values.reverbMute = 0;
project.values.delayVolume = 0;
project.song.playlist = Array(255).fill(0);
for (let p = 0; p < 8; p++) project.song.playlist[p] = p + 1;
project.song.playlistPos = 0;
const previousCwd = process.cwd();
process.chdir(build);
await Tracker.writeProject(project);
process.chdir(patDir);
await Tracker.writePatternsMetadata(Tracker.createPatternsMetadata(names));
process.chdir(previousCwd);

const checks = [];
const rebuiltProject = await Tracker.readProject(path.join(build, 'project.mt'));
if (!rebuiltProject || rebuiltProject.values.globalTempo !== 60)
  throw new Error('Project round-trip validation failed');
for (let index = 0; index < 8; index++) {
  const pti = path.join(instDir, String(index + 1) + ' ECHOIR' + String(index + 1).padStart(2, '0') + '.pti');
  const mtp = path.join(patDir, 'pattern_' + String(index + 1).padStart(2, '0') + '.mtp');
  const inst = await Tracker.readInstrument(pti);
  const pat = await Tracker.readPattern(mtp);
  if (!inst || inst.playmode !== InstrumentPlayMode.Granular || inst.tune !== -7)
    throw new Error('Instrument validation failed: ' + pti);
  if (!pat || pat.tracks[index].steps[starts[index]].instrument !== index)
    throw new Error('Pattern validation failed: ' + mtp);
  checks.push({
    voice:index + 1, sample:inst.sample.filename, frames:inst.sample.length,
    position:inst.granular.currentPosition, grainSamples:inst.granular.grainLength,
    cutoff:inst.cutoff, note:pat.tracks[index].steps[starts[index]].note
  });
}
const metadata = await Tracker.readPatternsMetadata(path.join(patDir, 'patternsMetadata'));
if (!metadata || metadata.patternNames.slice(0, 8).join('|') !== names.join('|'))
  throw new Error('Pattern metadata validation failed');

fs.cpSync(build, target, { recursive:true, force:false, errorOnExist:true });
const report = {
  target, source, sourceKey:'G minor', trackerKey:'E natural minor',
  tuning:'Each instrument is -7 semitones; E-pattern notes reproduce E minor.',
  sample:info, embeddedSeconds:(info.numFrames / info.sampleRate) * 8,
  tempo:rebuiltProject.values.globalTempo, patterns:names, checks
};
fs.writeFileSync(path.join(work, 'build-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
