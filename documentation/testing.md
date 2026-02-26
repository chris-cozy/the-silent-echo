# Testing Strategy

## Commands

- `npm test`: full suite (`unit`, `playthrough`, `fixtures`, `smoke`)
- `npm run test:watch`: watch mode
- `npm run test:smoke`: smoke-only deterministic run

## Coverage layers

### Unit tests (`tests/engine.unit.test.js`)

Validate deterministic mechanics and gating:

- descriptor-to-true room naming progression
- graph/nav door-state rendering
- emergency allocation defaults, lock behavior, and pool mechanics
- control-room threshold regression/restoration
- AI offline percentage and query branching
- maintenance chain constraints

### Scripted playthroughs (`tests/playthrough.test.js`)

Run canonical end-to-end flows:

1. toolkit unlock + demo-end completion
2. control-room power drop regression and recovery
3. branch-B AI flow requiring droid inspection before resume

### Fixture tests (`tests/fixtures.test.js`)

Load stable checkpoint states and assert transitions/invariants.

Current fixtures:

- `at_hub_entry_before_collapse.json`
- `hub_after_collapse.json`
- `power_station_before_panel_inspect.json`
- `power_station_allocation_ui_unlocked.json`
- `control_room_active_ai_online.json`
- `control_room_power_dropped_ai_off.json`
- `maintenance_droid_inspected_no_toolkit.json`
- `toolkit_added_end_modal.json`

### Smoke test (`tests/smoke.test.js`)

Short deterministic traversal that reaches allocation UI, performs power adjustment, and asserts invariant bounds/no crashes.

## Determinism and reproduction

- Runs use seeded RNG from `src/game/logVariants.ts`.
- Use fixed seed values in tests to reproduce progression issues.
- If a failure occurs, re-run the single test file and inspect the step where state diverges from expected gate conditions.
