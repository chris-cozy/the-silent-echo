# Testing Strategy

## Current status

There is no automated test suite in the repository yet.

Manual testing is the primary validation loop:
- run `npm run dev`,
- play through the intro progression,
- verify log flow, cooldown behavior, and demo restart.

## Recommended next steps (when tests are added)

A layered approach will scale best as systems grow:

- **Unit tests** for deterministic logic (resource ticks, unlock gates).
- **Scripted playthroughs** for intro milestones and regression prevention.
- **Fixture snapshots** for key mid-run states (after band, before doorway, etc.).
- **Smoke test** for a short deterministic run in CI.

## Suggested structure

```text
tests/
├─ game.unit.test.js
├─ playthrough.test.js
├─ fixtures/
└─ helpers/
```

## Deterministic RNG guidance

Run-seeded logs already exist in `src/game/logVariants.ts`. When tests are introduced, pass fixed seeds to keep runs repeatable and easy to debug.
