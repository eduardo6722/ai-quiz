Empty `human-labels.v1.json` means calibration is **not run**. Fill labels after a live review of both README sources, both question types, all judge disagreements, and all blocking semantic fails.

A live `pnpm eval:golden --live --repeat` run has been recorded in `docs/evals/phase-7-report.md`. Labels stay empty until a human reviews the generated questions; do not invent agreement to flip calibration to passed.
