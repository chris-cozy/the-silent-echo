# Testing Strategy

This project uses a layered test approach so regression checks are fast, repeatable, and deterministic as content grows.

## Test layers

- **Unit tests**: Validate deterministic core logic (state transitions, gating, resource ticks).
- **Scripted playthroughs**: Multi-step flows that exercise progression gates and branching paths.
- **Save-state fixtures**: JSON snapshots of `GameState` at key moments to prevent regressions mid-run.
- **Headless smoke test**: Short deterministic run that asserts no crashes and basic invariants.

## Running tests

Tests use Node's built-in test runner (`node --test`).

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Smoke test only:

```bash
npm run test:smoke
```

## Where tests live

```text
tests/
├─ engine.unit.test.js
├─ playthrough.test.js
├─ fixtures.test.js
├─ smoke.test.js
└─ helpers/
   └─ engineHarness.js
```

## Adding unit tests

Unit tests should target the deterministic engine in `src/game/engine.ts`:

- Use `createRun()` from `tests/helpers/engineHarness.js` to build a seeded run.
- Call `action()`, `tick()`, or `enter()` to drive state transitions.
- Assert on `run.state` and returned log keys.

## Scripted playthroughs

Playthrough tests belong in `tests/playthrough.test.js`:

- Keep scripts short and focused on a specific gate or branch.
- Prefer deterministic setups (seeded RNG + explicit state preparation).
- Assert checkpoints (location, unlock flags, navigation entries, player name).

Example harness usage:

```js
import { createRun, wake, action, tick } from "./helpers/engineHarness.js";

const run = createRun({ seed: 42 });
wake(run);
action(run, "stoke");
tick(run, 2000);
```

## Save-state fixtures

Fixtures are in `tests/fixtures/*.json` and represent canonical mid-run checkpoints.

Guidelines:

- Update fixtures intentionally; avoid “auto-updating” after small changes.
- When a fixture changes, confirm the progression gate it represents is still correct.
- Fixture tests should load the JSON and run a minimal script to validate invariants.
- Fixtures store `GameState` only; runtime counters are re-initialized in tests.

## Headless smoke test

`tests/smoke.test.js` runs a short deterministic loop with seeded RNG and basic actions:

- Ensures no exceptions and no invalid state values.
- Provides a lightweight guardrail for CI.

## CI integration

Recommended CI command:

```bash
npm test
```

This includes unit, playthrough, fixture, and smoke tests in one run. If you want smoke-only in a quick pipeline, run `npm run test:smoke`.

## Deterministic RNG

- Run seeds are created in `src/game/logVariants.ts`.
- Tests should pass a fixed seed to `createRun()` to ensure deterministic behavior.
- If a test fails, capture the seed and action sequence to reproduce the run.
