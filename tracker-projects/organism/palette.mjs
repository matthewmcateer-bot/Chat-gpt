import fs from 'node:fs';
import path from 'node:path';
import wavefile from 'wavefile';
import Tracker, { AudioUtil } from '@polyend/tracker-lib';
const { WaveFile } = wavefile;

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const project = path.resolve(arg('--project'));
const voice5 = path.resolve(arg('--voice5'));
const voice6 = path.resolve(arg('--voice6'));
if (/^d:\\/i.test(project)) throw Error('Safety: palette changes on SD card are forbidden');
if (![project, voice5, voice6].every(fs.existsSync)) throw Error('Missing project or source file');

function cropMono(file, seconds, fraction) {
  const wav = new WaveFile(fs.readFileSync(file));
  if (wav.fmt.sampleRate !== 44100) wav.toSampleRate(44100);
  const channels = wav.getSamples(false, Float64Array);
  const left = Array.isArray(channels) ? channels[0] : channels;
  const right = Array.isArray(channels) ? channels[1] : null;
  const frames = Math.min(Math.round(seconds * 44100), left.length);
  const maxStart = Math.max(0, left.length - frames);
  const start = Math.round(maxStart * fraction);
  const mono = new Float32Array(frames);
  let peak = 0;
  for (let i = 0; i < frames; i++) {
    mono[i] = right ? (left[start + i] + right[start + i]) * 0.5 : left[start + i];
    peak = Math.max(peak, Math.abs(mono[i]));
  }
  if (!peak) throw Error('Silent source: ' + file);
  for (let i = 0; i < frames; i++) mono[i] = mono[i] / peak * 0.42;
  return AudioUtil.createWavFile(mono, { numChannels: 1, sampleRate: 44100, bitsPerSample: 16 });
}
const slots = [
  { slot: 5, source: voice5, seconds: 3.0, fraction: 0.22, sampleName: 'DREAMMEM', grain: 6174, position: 0.38, volume: 0.18, reverb: 0.17, resonance: 0.20 },
  { slot: 6, source: voice6, seconds: 3.0, fraction: 0.56, sampleName: 'FATHERM', grain: 7938, position: 0.63, volume: 0.17, reverb: 0.15, resonance: 0.18 },
];
const instDir = path.join(project, 'instruments');
const sampleDir = path.join(project, 'samples');
fs.mkdirSync(sampleDir, { recursive: true });
const files = fs.readdirSync(instDir).filter(f => f.endsWith('.pti')).sort((a, b) => parseInt(a) - parseInt(b));
const replaced = [];
for (const cfg of slots) {
  const filename = files.find(f => parseInt(f) === cfg.slot);
  if (!filename) throw Error('Cannot find instrument slot ' + cfg.slot);
  const instrumentPath = path.join(instDir, filename);
  const inst = await Tracker.readInstrument(instrumentPath);
  const wav = cropMono(cfg.source, cfg.seconds, cfg.fraction);
  inst.setSample(wav);
  inst.sample.filename = cfg.sampleName;
  inst.granular.grainLength = cfg.grain;
  inst.granular.currentPosition = Math.round(cfg.position * 65535);
  inst.volume = cfg.volume;
  inst.reverbSend = cfg.reverb;
  inst.resonance = cfg.resonance;
  inst.overdrive = 0;
  for (let i = 1; i < inst.automations.length; i++) {
    if (i !== 4) {
      inst.automations[i].enabled = false;
      inst.automations[i].isLFO = false;
      inst.automations[i].lfo.amount = 0;
    }
  }
  inst.automations[4].enabled = true;
  inst.automations[4].isLFO = true;
  inst.automations[4].lfo.amount = 0.04;
  await Tracker.writeInstrument(inst, instrumentPath);
  fs.writeFileSync(path.join(sampleDir, cfg.sampleName + '_3s.wav'), Buffer.from(wav));
  replaced.push({ slot: cfg.slot, file: filename, source: cfg.source, frames: inst.sample.length, sampleName: cfg.sampleName });
}
const stats = [];
for (const file of files) {
  const inst = await Tracker.readInstrument(path.join(instDir, file));
  stats.push({
    file,
    sample: inst.sample.filename,
    seconds: +(inst.sample.length / 44100).toFixed(2),
    activeLFOs: inst.automations.filter(a => a.enabled && a.isLFO).length,
    volume: inst.volume,
    reverbSend: inst.reverbSend,
    resonance: inst.resonance,
  });
}
const report = {
  status: stats.length === 6 && stats.every(x => x.activeLFOs <= 1) && stats.reduce((s, x) => s + x.seconds, 0) <= 30 ? 'PASS' : 'FAIL',
  replaced,
  totalEmbeddedSeconds: +stats.reduce((s, x) => s + x.seconds, 0).toFixed(2),
  stats,
};
fs.writeFileSync(path.join(project, 'PALETTE_REPORT.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
