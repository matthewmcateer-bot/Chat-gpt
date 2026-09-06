import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Tracker, { AudioUtil } from '@polyend/tracker-lib';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const projectRoot = path.resolve(arg('--project'));
const baselineRoot = path.resolve(arg('--baseline'));
const sdRoot = arg('--sd') ? path.resolve(arg('--sd')) : null;
const reportFile = arg('--report') ? path.resolve(arg('--report')) : null;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function crc32(buffer) {
  let c = 0xffffffff;
  for (const x of buffer) {
    c ^= x;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
const patterns = [];
const positions = new Set();
const filterTypes = new Set();
const instrumentNames = fs.readdirSync(path.join(projectRoot, 'instruments')).filter(f => f.endsWith('.pti')).sort();
const baselineNames = fs.readdirSync(path.join(baselineRoot, 'instruments')).filter(f => f.endsWith('.pti')).sort();
const instrumentIdentity = instrumentNames.length === 6 && JSON.stringify(instrumentNames) === JSON.stringify(baselineNames)
  && instrumentNames.every(f => hash(path.join(projectRoot, 'instruments', f)) === hash(path.join(baselineRoot, 'instruments', f)));
const instrumentStats = [];
const audioHashes = new Set();
for (const f of instrumentNames) {
  const inst = await Tracker.readInstrument(path.join(projectRoot, 'instruments', f));
  const info = AudioUtil.getWavInfo(inst.wav);
  const wavHash = crypto.createHash('sha256').update(Buffer.from(inst.wav)).digest('hex');
  audioHashes.add(wavHash);
  instrumentStats.push({ file: f, sample: inst.sample.filename, seconds: +(info.numFrames / info.sampleRate).toFixed(2), activeLFOs: inst.automations.filter(a => a.enabled && a.isLFO).length });
}
const totalEmbeddedSeconds = +instrumentStats.reduce((s, x) => s + x.seconds, 0).toFixed(2);
const safeResourceProfile = instrumentStats.length === 6 && totalEmbeddedSeconds <= 30 && instrumentStats.every(x => x.activeLFOs <= 1);
for (let n = 1; n <= 8; n++) {
  const id = String(n).padStart(2, '0');
  const file = path.join(projectRoot, 'patterns', 'pattern_' + id + '.mtp');
  const b = fs.readFileSync(file);
  const p = await Tracker.readPattern(file);
  const stored = b.readUInt32LE(b.length - 4);
  const calc = crc32(b.subarray(0, b.length - 4));
  const audioEvents = [];
  for (let t = 0; t < 6; t++) {
    for (let row = 0; row < 64; row++) {
      const s = p.tracks[t].steps[row];
      if (s.note >= 0) {
        audioEvents.push({ track: t, row, note: s.note, fx: s.fx.map(x => [x.type.index, x.value]) });
        for (const e of s.fx) {
          if (e.type.index === 22) positions.add(e.value);
          if ([27, 28, 29].includes(e.type.index)) filterTypes.add(e.type.index);
        }
      }
    }
  }
  const dm = p.tracks[8].steps.map((s, row) => ({ row, s })).filter(x => x.s.note >= 0);
  const zc = p.tracks[9].steps.map((s, row) => ({ row, s })).filter(x => x.s.note >= 0);
  const activeVoices = new Set(audioEvents.map(e => e.track)).size;
  patterns.push({
    pattern: n,
    bytes: b.length,
    headerSize: b.readUInt16LE(12),
    crcPass: stored === calc,
    activeVoices,
    audioRows: audioEvents.map(e => e.row),
    audioNotes: audioEvents.map(e => e.note),
    deepMindCount: dm.length,
    deepMindRows: dm.map(x => x.row),
    zeroCoastCount: zc.length,
    zeroCoastRows: zc.map(x => x.row),
  });
}
const metadata = await Tracker.readPatternsMetadata(path.join(projectRoot, 'patterns', 'patternsMetadata'));
const project = await Tracker.readProject(path.join(projectRoot, 'project.mt'));
const projectBytes = fs.readFileSync(path.join(projectRoot, 'project.mt'));
const projectCrcPass = projectBytes.readUInt32LE(projectBytes.length - 4) === crc32(projectBytes.subarray(0, projectBytes.length - 4));
const populations = patterns.map(p => p.activeVoices);
const dmCounts = patterns.map(p => p.deepMindCount);
const quarterGridCount = patterns.filter(p => JSON.stringify(p.deepMindRows) === JSON.stringify([0, 16, 32, 48])).length;
const voidCount = patterns.filter(p => p.activeVoices === 0 && p.deepMindCount === 0 && p.zeroCoastCount === 0).length;
const formatPass = projectCrcPass && patterns.every(p => p.bytes === 9260 && p.headerSize === 9260 && p.crcPass);
const memoryLagPass = patterns.every(p => p.deepMindCount === 0 || p.activeVoices === 0 || Math.min(...p.deepMindRows) > Math.max(...p.audioRows));
const transitionCleanup = patterns.every(p => p.audioRows.every(row => row > 0));
const designChecks = {
  sixVoiceCeiling: Math.max(...populations) <= 6,
  safeResourceProfile,
  variedPopulation: new Set(populations).size >= 4,
  trueVoid: voidCount >= 1,
  transitionCleanup,
  irregularDeepMind: quarterGridCount === 0 && new Set(dmCounts).size >= 3,
  memoryLagPass,
  grainRegionDiversity: positions.size >= 10,
  filterTopologyDiversity: filterTypes.size >= 3,
  sourceDiversity: audioHashes.size >= 3,
  metadataStates: metadata?.patternNames.slice(0, 8).filter(Boolean).length === 8,
};
const designPass = Object.values(designChecks).every(Boolean);

let sdUnchanged = null;
if (sdRoot) {
  const rels = ['project.mt', 'patterns/patternsMetadata', ...Array.from({ length: 8 }, (_, i) => `patterns/pattern_${String(i + 1).padStart(2, '0')}.mtp`), ...baselineNames.map(f => 'instruments/' + f)];
  sdUnchanged = rels.every(rel => hash(path.join(sdRoot, rel)) === hash(path.join(baselineRoot, rel)));
}
const report = {
  status: formatPass && designPass && sdUnchanged !== false ? 'PASS' : 'FAIL',
  formatPass,
  designPass,
  sdUnchanged,
  projectName: project?.projectName,
  tempo: project?.values.globalTempo,
  instrumentIdentity,
  instrumentStats,
  totalEmbeddedSeconds,
  uniqueEmbeddedAudioSources: audioHashes.size,
  memoryLagPass,
  transitionCleanup,
  populations,
  uniquePopulationCounts: [...new Set(populations)].sort((a, b) => a - b),
  deepMindCounts: dmCounts,
  positionDiversity: positions.size,
  filterTypes: [...filterTypes].sort(),
  voidCount,
  quarterGridCount,
  designChecks,
  patterns,
};
if (reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
