# Tracker projects

`legacy-builder/` preserves the original laptop scripts and reports from the E-minor granular-drone reverse-engineering work. Those historical scripts contain machine-specific paths and some can write directly to `D:` and Workspace; treat them as reference material, not the current build path.

`organism/` is the redesigned path. It separates baseline, specification, build, palette, audit and eventual deployment. The engine refuses direct `D:` output, so new projects are built and validated on the laptop first.

Current Organism V2 changes the old fixed six-voice template into eight states with 0-6 active granular voices, irregular entrances, a genuine void, delayed DeepMind memory events, pattern-specific position/filter identity, and an optional heterogeneous speech palette while retaining the proven six-voice / one-LFO / <=30-second resource budget.

The latest laptop build passed both FORMAT and DESIGN audits and the physical SD project remained byte-identical to the frozen `E_MINOR_GRAIN_DRONE` baseline. Generated `.mtp`, `.pti`, `.wav` and project binaries remain excluded from GitHub. Hardware listening validation is still required before deployment.
