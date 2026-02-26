# Architecture

## Runtime flow

1. `src/main.ts` starts `startGame()`.
2. `src/game/game.ts` creates `UI` and `Game` instances and owns the tick loop.
3. Engine functions in `src/game/engine.ts` mutate deterministic state and return log events.
4. `Game.render()` derives a UI model (`deriveUiState`) and pushes panel state into `UI`.

## Core state model

`GameState` now has five major domains:

- `rooms`: room-local discovery/action flags for `pod_room`, `control_room`, `central_hub`, `research_lab`, `power_station`, `maintenance_bay`.
- `power`: emergency allocation values, locked Restricted Lab allocation, and reallocatable pool.
- `ai`: unlock/online/query progression and branch gating state.
- `inventory`: persistent items/resources shown in STORAGE.
- survival runtime: heat/health/time plus intro progression and end/death markers.

## Map graph model

Traversal is graph-based in `engine.ts`:

- Edges carry a door state: `open`, `jammed`, `sealed`, `collapsed`.
- Navigation is rendered in a fixed, static order once entries are discovered.
- Once a nav entry is discovered it remains visible, even when not currently adjacent.
- Door status drives nav button affordance (`ENTER`, `JAMMED`, `SEALED`, `BLOCKED`, `UNREACHABLE`).
- Room transitions are valid only over `open` edges to real rooms.

Implemented route spine:

- `POD ROOM <-> CONTROL ROOM <-> CENTRAL HUB <-> RESEARCH LAB <-> POWER STATION`
- `RESEARCH LAB <-> MAINTENANCE BAY`
- blocked edges surfaced in nav: `LIFE SUPPORT` (jammed), `AIRLOCK` (sealed), `LIVING QUARTERS` (collapsed), `RESTRICTED LAB` (sealed)

## Discovery and naming

Each major room has:

- `descriptorName` shown initially.
- `trueName` shown only after meaningful discovery.
- `displayName` used by the room header and navigation labels.
- Names are globally consistent: once `displayName` changes, all nav entries use that same name.

This keeps unknown spaces obscured until player interaction reveals context.

## Allocation and control-room dependency

Emergency allocation is a deterministic system:

- Adjustable pool starts at 0 and increases only by deallocation.
- `restricted_lab` allocation is locked by protocol.
- Failure-state rooms (`pod_room`, `life_support`, `med_bay`) expose inspectable reasons.

Derived effects:

- Control Room functional threshold: `allocation(control_room) >= 3`.
- Maintenance threshold for boot stability: `allocation(maintenance_bay) >= 2`.

Dropping Control Room below threshold after AI boot regresses room capability (AI hidden, FEEL path restored).

## AI state machine overlay

The AI progression overlays room and allocation state:

- offline panel unlocks from terminal inspection.
- offline reason includes dynamic reserve percentage from control-room allocation.
- online boot occurs once allocation threshold is met and posts one-time greeting.
- `QUERY` advances a scripted chain with a branch on `droid_inspected`.

## UI composition

Panels are tabbed and derived, not manually toggled by script branches:

- Room/action panel (left)
- Systems tab panel (`VITALS BAND`, `STORAGE`)
- Operations tab panel (`AI`, `NAV`)
- In-room tabbing for `ACTIONS` and `POWER` (power tab only functions in the power room)
- LOG panel (right)
