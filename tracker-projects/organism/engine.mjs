import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Tracker, { PatternFX } from '@polyend/tracker-lib';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const specArg = arg('--spec');
const sourceArg = arg('--source');
const outArg = arg('--out');
if (!specArg || !sourceArg || !outArg) {
  throw Error('Usage: node engine.mjs --spec SPEC --source BASELINE --out OUTPUT');
}
const specPath = path.resolve(specArg);
const source = path.resolve(sourceArg);
const out = path.resolve(outArg);
if (/^d:\\/i.test(out)) throw Error('Safety: direct SD-card output is forbidden');
if (!fs.existsSync(source)) throw Error('Missing source baseline: ' + source);
if (fs.existsSync(out)) throw Error('Output already exists: ' + out);
const spec = (await import(pathToFileURL(specPath).href + '?t=' + Date.now())).default;

function crc32(buffer) {
  let c = 0xffffffff;
  for (const x of buffer) {
    c ^= x;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function blank(step) {
  step.note = -1;
  step.instrument = 0;
  step.fx = [
    { type: PatternFX[0], value: 0 },
    { type: PatternFX[0], value: 0 },
  ];
}
function fx(step, slot, type, value) {
  step.fx[slot] = { type: PatternFX[type], value };
}
function finalizePattern(file) {
  const b = fs.readFileSync(file);
  if (b.length !== 9260) throw Error('Expected OG 12-track pattern size: ' + file);
  b.writeUInt16LE(b.length, 12);
  for (let t = 0; t < 12; t++) {
    const base = 28 + t * 769;
    const len = b[base];
    for (let r = len + 1; r < 128; r++) {
      const o = base + 1 + r * 6;
      b[o] = 255;
      b.fill(0, o + 1, o + 6);
    }
  }
  b.writeUInt32LE(crc32(b.subarray(0, b.length - 4)), b.length - 4);
  fs.writeFileSync(file, b);
}
function sealProject(file) {
  const b = fs.readFileSync(file);
  b.writeUInt32LE(crc32(b.subarray(0, b.length - 4)), b.length - 4);
  fs.writeFileSync(file, b);
}
fs.cpSync(source, out, { recursive: true });
const patternsDir = path.join(out, 'patterns');
const auditPlan = [];

for (let i = 0; i < spec.states.length; i++) {
  const state = spec.states[i];
  const pattern = Tracker.createPattern(12, 64);
  pattern.header.fwVersion = [1, 9, 2, 1];
  pattern.header.size = 9260;
  for (let t = 0; t < 6; t++) {
    pattern.tracks[t].steps[0].note = state.releaseMode ?? -2;
  }
  for (const event of state.audio) {
    const step = pattern.tracks[event.track].steps[event.row];
    step.note = event.note;
    step.instrument = event.instrument ?? event.track;
    const effects = event.fx ?? [];
    effects.slice(0, 2).forEach((e, slot) => fx(step, slot, e.type, e.value));
  }
  for (const event of state.deepMind ?? []) {
    const step = pattern.tracks[8].steps[event.row];
    step.note = event.note;
    step.instrument = 48;
    fx(step, 0, 14, event.chord);
    fx(step, 1, 18, event.velocity);
  }
  for (const event of state.zeroCoast ?? []) {
    const step = pattern.tracks[9].steps[event.row];
    step.note = event.note;
    step.instrument = 49;
    fx(step, 0, 4, event.chance);
    fx(step, 1, 18, event.velocity);
  }
  const id = String(i + 1).padStart(2, '0');
  const target = path.join(patternsDir, 'pattern_' + id + '.mtp');
  await Tracker.writePattern(pattern, target);
  finalizePattern(target);
  auditPlan.push({ index: i + 1, name: state.name, state });
}
const cwd = process.cwd();
process.chdir(patternsDir);
await Tracker.writePatternsMetadata(Tracker.createPatternsMetadata(spec.states.map(s => s.name)));
process.chdir(cwd);

const projectFile = path.join(out, 'project.mt');
const project = await Tracker.readProject(projectFile);
if (!project) throw Error('Cannot read copied project');
project.projectName = spec.projectName;
project.values.globalTempo = spec.tempo ?? project.values.globalTempo;
project.values.reverbVolume = spec.reverbVolume ?? project.values.reverbVolume;
project.values.trackNames[0] = 'LOW A';
project.values.trackNames[1] = 'LOW B';
project.values.trackNames[2] = 'BODY A';
project.values.trackNames[3] = 'BODY B';
project.values.trackNames[4] = 'SHIM A';
project.values.trackNames[5] = 'SHIM B';
project.values.trackNames[6] = 'REST';
project.values.trackNames[7] = 'REST';
project.values.trackNames[8] = 'DM MEMORY';
project.values.trackNames[9] = '0C GHOST';
project.song.playlist.fill(0);
spec.playlist.forEach((p, i) => { project.song.playlist[i] = p; });
project.song.playlistPos = 0;
process.chdir(out);
await Tracker.writeProject(project);
process.chdir(cwd);
sealProject(projectFile);

const manifest = {
  engine: 'tracker-organism-v1',
  generatedAt: new Date().toISOString(),
  source,
  output: out,
  directSdWrite: false,
  spec: path.basename(specPath),
  projectName: spec.projectName,
  states: auditPlan,
};
fs.writeFileSync(path.join(out, 'ORGANISM_MANIFEST.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ status: 'BUILT', output: out, states: spec.states.length, directSdWrite: false }, null, 2));
const listeningFile = path.join(out, 'LISTENING_NOTES.json');
if (!fs.existsSync(listeningFile)) {
  const listening = {
    build: spec.projectName,
    auditioned: false,
    global: {
      mudOrDistortion: null,
      transitions: null,
      silenceDuration: null,
      externalGearBalance: null,
      keep: [],
      change: [],
    },
    states: spec.states.map((s, i) => ({ pattern: i + 1, name: s.name, heard: false, observations: [], keep: [], change: [] })),
  };
  fs.writeFileSync(listeningFile, JSON.stringify(listening, null, 2));
}
