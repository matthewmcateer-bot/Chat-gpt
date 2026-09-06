# Tracker Organism redesign

This redesign keeps the current `E_MINOR_GRAIN_DRONE` SD project frozen as the known-good hardware baseline and builds new projects on the laptop first.

## Problems addressed

- Fixed six-voice-on-every-pattern texture.
- Fixed DeepMind quarter-grid placement at rows 0/16/32/48.
- No true absence state.
- One duplicated choir source across all granular voices.
- Build and SD deployment were entangled in legacy repair scripts.
- PASS meant file integrity rather than musical-design integrity.
- Listening observations had no durable representation.

## V2 architecture

`baseline -> engine -> project spec -> optional palette -> FORMAT audit + DESIGN audit -> listening notes -> optional later deployment`

The engine rejects direct `D:` output. Generated Tracker projects and audio are intentionally excluded from GitHub; only reusable source and specifications belong here.

## Current V2 design

- Maximum six granular voices remains the resource ceiling learned from the hardware overload incident.
- Pattern populations: 2, 3, 4, 6, 4, 2, 0, 3 voices.
- Every audio state begins after a row-0 OFF/FAD transition command.
- DeepMind is treated as memory: its events occur after the granular entrances in the same state.
- One genuine void state is repeated three times in the song playlist.
- Position and LP/HP/BP filtering vary by state rather than leaving all six voices fixed.
- Two of the six instruments may be replaced by three-second speech fragments while retaining one LFO per voice and a <=30 second embedded-audio budget.
- `LISTENING_NOTES.json` is generated beside each laptop build so audition feedback can drive the next spec revision.

## Latest laptop audit

V2 passed both FORMAT and DESIGN audits: 8 valid 9260-byte patterns with valid CRCs, valid project CRC, six-voice ceiling respected, 26 seconds total embedded audio, three unique embedded audio sources, 24 position values, LP/HP/BP diversity, irregular DeepMind density, memory-lag rule passed, transition-cleanup rule passed, and the physical SD project remained byte-identical to the frozen baseline.

The next required validation is listening on the Tracker/hardware rig. Static validation cannot decide whether the new state form is musically successful.
