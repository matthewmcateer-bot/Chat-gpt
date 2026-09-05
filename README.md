# Evolverman music development

Polyend Tracker project source and briefs, Emergent Properties Max for Live development, and the IRREDUCIBLE SuperCollider reference.

- `tracker-projects/`: seven proposed projects and 29 historical builder/audit scripts. The seven projects are concepts, not completed Tracker projects.
- `emergent-properties/`: original suite builder and Field Organism preview, drawing on weighted breathing, flurries and thinning in IRREDUCIBLE v0.2.

## Build the preview

Run `python emergent-properties/build_preview.py` with Python 3. No external Python packages are required. The generated AMXD appears in `emergent-properties/devices/`.

Read `emergent-properties/docs/AUDITION.md` before auditioning. Structural validation passed on the laptop; Max/Live compilation and listening validation remain pending. This is not yet a full port of the SuperCollider synthesis engine.

## Work in small checkpoints

1. Compile and audition Field Organism with Resonant Matter in Ableton.
2. Adjust one behavior from listening feedback.
3. Port persistent frequency relocation into Spectral Lattice.
4. Refactor Tracker scripts to explicit input/output paths before building a new SD project.

Historical Tracker scripts contain machine-specific paths and can write directly to the SD card. Samples, generated instruments and personal recording assets are not included.
