const P = 22, LP = 27, HP = 28, BP = 29, CHANCE = 4;
const CH = { Min: 3, Maj: 4, Open5: 10, Stack5: 11, Min7: 19, Maj6: 21, Dom7: 22, Maj7: 23 };
const pf = (position, filterType, filterValue) => [
  { type: P, value: position },
  { type: filterType, value: filterValue },
];
const cp = (chance, position) => [
  { type: CHANCE, value: chance },
  { type: P, value: position },
];

export default {
  projectName: 'TRACKER ORGANISM LAB V2',
  tempo: 60,
  reverbVolume: 30,
  playlist: [1, 2, 3, 4, 5, 6, 7, 7, 7, 8, 8],
  states: [
    {
      name: 'SEED / TWO VOICES',
      audio: [
        { track: 0, row: 5, note: 40, fx: pf(12, LP, 40) },
        { track: 3, row: 29, note: 52, fx: pf(31, BP, 47) },
      ],
      deepMind: [],
      zeroCoast: [{ row: 51, note: 71, chance: 32, velocity: 35 }],
    },
    {
      name: 'VEIL / THREE VOICES',
      audio: [
        { track: 0, row: 3, note: 40, fx: pf(19, LP, 48) },
        { track: 2, row: 17, note: 52, fx: pf(38, BP, 42) },
        { track: 5, row: 43, note: 64, fx: pf(74, HP, 35) },
      ],
      deepMind: [{ row: 52, note: 52, chord: CH.Open5, velocity: 44 }],
      zeroCoast: [],
    },
    {
      name: 'GATHER / FOUR VOICES',
      audio: [
        { track: 0, row: 2, note: 43, fx: pf(11, LP, 55) },
        { track: 1, row: 9, note: 43, fx: pf(27, LP, 47) },
        { track: 3, row: 25, note: 55, fx: pf(55, BP, 50) },
        { track: 4, row: 47, note: 67, fx: pf(83, HP, 32) },
      ],
      deepMind: [
        { row: 51, note: 43, chord: CH.Maj6, velocity: 48 },
        { row: 60, note: 54, chord: CH.Open5, velocity: 41 },
      ],
      zeroCoast: [
        { row: 21, note: 67, chance: 43, velocity: 39 },
        { row: 58, note: 74, chance: 31, velocity: 32 },
      ],
    },
    {
      name: 'PRESSURE / SIX VOICES',
      audio: [
        { track: 0, row: 2, note: 45, fx: pf(15, LP, 60) },
        { track: 1, row: 7, note: 45, fx: pf(29, LP, 52) },
        { track: 2, row: 14, note: 57, fx: pf(43, BP, 58) },
        { track: 3, row: 23, note: 57, fx: pf(57, BP, 52) },
        { track: 4, row: 36, note: 69, fx: pf(71, HP, 44) },
        { track: 5, row: 50, note: 69, fx: pf(86, HP, 38) },
      ],
      deepMind: [
        { row: 54, note: 45, chord: CH.Min7, velocity: 54 },
        { row: 59, note: 47, chord: CH.Stack5, velocity: 47 },
        { row: 63, note: 43, chord: CH.Maj6, velocity: 42 },
      ],
      zeroCoast: [
        { row: 18, note: 69, chance: 52, velocity: 44 },
        { row: 42, note: 76, chance: 39, velocity: 38 },
        { row: 61, note: 72, chance: 27, velocity: 31 },
      ],
    },
    {
      name: 'FRACTURE / UNSTABLE FOUR',
      audio: [
        { track: 0, row: 3, note: 47, fx: cp(78, 17) },
        { track: 2, row: 20, note: 59, fx: cp(65, 44) },
        { track: 4, row: 37, note: 71, fx: cp(52, 76) },
        { track: 5, row: 53, note: 70, fx: cp(43, 89) },
      ],
      deepMind: [{ row: 58, note: 47, chord: CH.Stack5, velocity: 50 }],
      zeroCoast: [
        { row: 11, note: 74, chance: 61, velocity: 48 },
        { row: 47, note: 76, chance: 38, velocity: 34 },
      ],
    },
    {
      name: 'AFTERIMAGE / TWO VOICES',
      audio: [
        { track: 1, row: 17, note: 48, fx: pf(33, LP, 34) },
        { track: 4, row: 48, note: 72, fx: pf(68, HP, 27) },
      ],
      deepMind: [
        { row: 52, note: 48, chord: CH.Maj7, velocity: 43 },
        { row: 61, note: 45, chord: CH.Open5, velocity: 37 },
      ],
      zeroCoast: [{ row: 55, note: 67, chance: 28, velocity: 30 }],
    },
    {
      name: 'VOID / THREE PATTERNS LONG',
      releaseMode: -4,
      audio: [],
      deepMind: [],
      zeroCoast: [],
    },
    {
      name: 'DISPLACED RETURN',
      audio: [
        { track: 0, row: 8, note: 40, fx: pf(24, LP, 45) },
        { track: 2, row: 26, note: 53, fx: pf(51, BP, 46) },
        { track: 5, row: 49, note: 64, fx: pf(79, HP, 30) },
      ],
      deepMind: [
        { row: 53, note: 52, chord: CH.Open5, velocity: 42 },
        { row: 61, note: 47, chord: CH.Dom7, velocity: 39 },
      ],
      zeroCoast: [{ row: 56, note: 68, chance: 34, velocity: 32 }],
    },
  ],
};
