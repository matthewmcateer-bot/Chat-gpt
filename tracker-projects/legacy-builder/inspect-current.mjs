import Tracker from '@polyend/tracker-lib';

const project = await Tracker.readProject('D:\\Workspace\\project.mt');
const pattern = await Tracker.readPattern('D:\\Workspace\\patterns\\pattern_01.mtp');
const instrument = await Tracker.readInstrument('D:\\Workspace\\instruments\\instrument_10.pti');
const metadata = await Tracker.readPatternsMetadata('D:\\Workspace\\patterns\\patternsMetadata');

const slimInstrument = instrument && {
  sample: instrument.sample, playmode: instrument.playmode,
  cutoff: instrument.cutoff, resonance: instrument.resonance,
  filterType: instrument.filterType, filterEnabled: instrument.filterEnabled,
  tune: instrument.tune, finetune: instrument.finetune, volume: instrument.volume,
  panning: instrument.panning, delaySend: instrument.delaySend,
  reverbSend: instrument.reverbSend, granular: instrument.granular,
  automations: instrument.automations
};
const used = pattern?.tracks.map((track, index) => ({
  index, length: track.length,
  steps: track.steps.map((step, row) => ({ row, ...step }))
    .filter(step => step.note !== -1 || step.fx.some(fx => fx.type.index !== 0))
}));
console.log(JSON.stringify({ project, metadata, pattern: pattern && {
  header: pattern.header, trackCount: pattern.trackCount, used
}, instrument: slimInstrument }, null, 2));