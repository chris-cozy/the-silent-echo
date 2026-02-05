# Gameplay Systems (Current Demo)

## Intro progression

The opening sequence is a staged state machine:

1. `LIFE_START`
2. `BOOTING`
3. `DARKNESS`
4. `LOOK_UNLOCKED`
5. `REVEAL_1`
6. `BAND_AVAILABLE`
7. `BAND_TAKEN`
8. `NAV_UNLOCKED`
9. `DEMO_END`

State is tracked in `GameState.stage` and related flags in `src/game/types.ts`.

## Survival loop

The primary loop is heat management:
- `STOKE EMBERS` increases heat.
- Heat decays over time.
- If heat is above zero, health regenerates slowly.
- If heat is zero, health drains and freeze warnings appear.

Key constants (from `src/game/game.ts`):
- Stoke cooldown: `2000ms`
- Heat decay: `1/sec`
- Health regen cadence: `+1 every 3 sec`
- Health drain cadence: `-1 every 2 sec`

## Unlock conditions

- First stoke initializes run and sets baseline heat.
- `LOOK AROUND` unlocks only when both:
  - heat is greater than `30`, and
  - health is greater than `12`.
- `TAKE THE BAND` unlocks after reveal step 2.
- `ENTER` unlocks after reveal step 3 and opens the second room.
- `INSPECT TERMINALS` unlocks after the terminal discovery in the second room.
- The demo ends only after entering the partially closed doorway.

## Progressive affordances

- Start: one action (`STOKE EMBERS`).
- Mid-intro: `LOOK AROUND` appears.
- Later: `TAKE THE BAND` appears.
- Post-reveal: navigation panel appears with doorway `ENTER` action.
- After band is taken: VITALS panel appears (`Health`, `Heat`, `Time`).
- STORAGE panel persists across rooms and lists acquired items.
- Terminal inspection unlocks the ARTIFICIAL INTELLIGENCE panel (OFFLINE status).

## Time model (demo)

A diegetic station clock advances continuously:
- every real second advances in-game time by 5 minutes,
- time wraps at 24h.

This currently affects presentation only; full day/night budgeting is planned for later phases.

## Logs and narrative texture

Two channels:
- system messages (`SYSTEM:` prefixed),
- narrative messages.

Variant selection is run-seeded and anti-repetitive, which gives each run slight text variation without changing mechanics.

## Cross-room dependencies

- Pulling the lever in the terminal room unlocks a one-time retroactive reveal in the starting room.
- The next `LOOK AROUND` in the starting room after lever activation renames it to `POD ROOM`.

## Death and reset

If health reaches zero:
- a death system line and narrative line are logged,
- the run is reset to initial state,
- wake screen returns for immediate replay.

## Debug hooks (development)

Available on `window.__aseDebug`:
- `boostVitals()`
- `unlockLook()`
- `jumpReveal3()`

Additional setters (vitals, room jumps, reveal steps, fast-forward) are documented in `documentation/development.md`.
