# A Silent Echo - Game Spec (A Dark Room-inspired)

> This document captures the intended long-term design direction. It is not a description of current implementation. For current behavior, see `documentation/gameplay-systems.md`.

## Purpose

Build a terminal-style, text-based sci-fi horror survival game explicitly inspired by A Dark Room. The experience starts minimal and readable, then expands through unlockable systems, automation, and systemic narrative twists delivered via UI/log corruption.

## Current Prototype Milestone

- Near-black start screen with `WAKE UP...` and boot sequence.
- Intro loop is LOG-driven with hidden heat/health pressure.
- Progression gates now span multiple rooms:
  - `STOKE EMBERS` -> `LOOK AROUND` staged reveals -> `TAKE THE BAND`
  - control-room discovery (`FEEL AROUND` / `PULL LEVER` / `INSPECT TERMINALS`)
  - hub and research exploration into service passages
  - power allocation + AI query loop -> emergency toolkit
- Demo currently ends when the emergency toolkit is added to STORAGE.

## Design Principles (A Dark Room Model)

- Minimal UI surface area that grows only when earned.
- Systems-first pacing where mechanics create story beats.
- Gradual reveal: survival -> production -> expansion -> discovery -> consequence.
- Repetition turns into efficiency, then dependency.
- Economy feel: resource conversion and upgrades drive long-term planning.

## UX and UI Direction

- Retro-futuristic UI that looks like a terminal, but runs in a modern browser.
- Green monochrome with scanline flicker, subtle glow, and boot-like transitions.
- The interface starts as a single central action button with only a side LOG panel visible.
- Panels unlock progressively through tabbed stacks: `VITALS BAND`/`STORAGE` and `AI`/`NAV`.
- LOG remains persistent on the side and records each action/event as short narrative sentences.
- Navigation remains graph-driven and spoiler-aware; labels update as rooms are discovered.
- Typed commands remain required for certain actions even after automation unlocks.

### UI Progression (Example)

- Start: boot sequence then one center button (`STOKE REACTOR`) + side LOG.
- Early: SYSTEM and ACTIONS panels unlock after manual stoke.
- Mid: INVENTORY unlocks after first successful scavenge, AI panel after Maintenance repair.
- Late: MAP panel appears after Control Room repair; TERMINAL panel unlocks after AI repair for direct AI interaction.

### Early Heat Loop (A Dark Room-style pressure)

- Before AI repair, heat drains in real time at 1 unit per second.
- Player must repeatedly stoke the reactor to survive.
- Stoke has a short cooldown with visible fill progress on the action button.
- Initial stoke sets heat to 30; subsequent stokes refill heat.
- Repeated stoking increases reactor heat capacity up to a fixed limit.
- Early HUD tracks only `heat` and `health` (start health 5/100).
- Positive heat slowly regenerates health; zero heat slowly drains health.
- Death occurs when health reaches 0 (echo iteration increments).
- At health above 25, `Look Around` unlocks and logs second-person room survey text.
- Log stream is newest-first with fading old entries; system logs are prefixed with `SYSTEM:`.
- AI panel is visible from the start with `ARTIFICIAL INTELLIGENCE OFFLINE`.
- Progression remains locked to `stoke` and `Look Around` until the first survey is completed.

## Core Loop

### Day Phase

- Spend discrete time units on actions: explore, scavenge, scrap, craft, repair.
- Unlock rooms through power + repairs + AI authorization.
- Update inventory and resource deltas.

### Night Phase

- Run stability checks for heat, air, water, food, power.
- Apply consumption multipliers and degradation.
- Trigger weighted events and corruption effects.

## Time Model

- Actions cost fixed time units.
- Day ends when budget is spent.
- Night runs as a deterministic sequence with RNG-driven events.

## Resources and Degradation

Resources: Heat, Air/Filtration, Water, Food, Power.

- Power is the master resource; all modules draw from it.
- Each resource tracks current, max, and in/out rates.
- Night increases consumption and degradation multipliers.
- Inventory capacity forces tradeoffs.

## Outpost Map and Rooms

- Rooms are a graph with flags: locked/unlocked, powered/unpowered, repaired/damaged, hazard/anomaly.
- Unlock rules:
  - Restore global power capacity.
  - Complete local repairs.
  - Later AI authorization can grant/revoke access.

### Vertical Slice Rooms

- Cryo/Intake
- Maintenance Bay
- Control Room
- Life Support
- Power Access

## Inventory and Crafting

- Limited inventory capacity with weight or slots.
- Scrapping yields parts but destroys future utility.
- Craftable items: heaters, filters, batteries, barricades, sensors, repair tools.

## Automation as Progression

- Manual typed commands only at start.
- Repeatable tasks (named routines) unlock after stabilization.
- Macros (player-defined sequences) unlock later.
- UI shortcuts appear for frequent operations.
- Some actions remain typing-only to preserve tension.

## AI State Machine

States: Offline -> Guidance -> Withholding -> Control.

- Visible stats: signal, integrity, compliance, mission_priority.
- Transitions triggered by milestones (power restored, rooms unlocked, logs found, convergence meter).
- Control behaviors: door locks, denied commands, rerouted tasks, mission overrides.

## Corruption and Convergence

- Corruption affects timestamps, metadata, repeated phrases, phantom entries, sensor contradictions.
- Corruption scales with night phase, convergence, sealed wing proximity, AI phase.
- Gameplay legibility is preserved; corruption is unsettling, not confusing.

## Events

- Weighted event tables by phase.
- Early: survival setbacks and minor glitches.
- Mid: contradictions, room state flips, impossible data.
- Late: convergence spikes, doors without power, persistent entity presence.

## Death as Canon (Echo Iteration)

- On death, increment echo_id.
- Boot screen, logs, and AI address reflect the new iteration.
- Optional persistent differences between runs.

## Data-Driven Content Model

- Rooms, items, events, crafting recipes, AI transitions, and unlock conditions should be data-driven.
- Content in JSON or TOML to allow expansion without code changes.

## Recommended Tech Stack

Based on the visual inspiration and terminal-like UI:

- Runtime: Web (Vite dev server)
- Language: TypeScript
- UI: HTML/CSS (grid panels, borders, glow, scanlines)
- Persistence: localStorage save files
- Content: JSON data packs for rooms/events/items

Rationale:
- The references emphasize stylized panels, glow, and CRT effects that are best handled in the browser.
- TypeScript keeps systems-heavy logic safe while CSS delivers the retro terminal aesthetic.

## Vertical Slice Checklist (A Dark Room-feel)

Target: prove the core loop and progressive reveal with 4-5 rooms.

1. Core loop
- Day and night phases with time budget
- Actions consume time and update resources
- Night checks with basic failure states

2. Minimal UI
- Single terminal log + SYSTEM readout
- One or two commands visible at start
- Boot screen intro

3. Rooms and unlocks
- Room graph with 4-5 rooms
- Unlock via global power + local repair
- Map panel appears only after Control Room repair

4. Resources and inventory
- Heat, Air, Water, Food, Power
- Inventory capacity and basic items
- Simple craft and scrap actions

5. Events
- Early-phase event table
- Night event triggers

6. Save and load
- JSON save file
- Echo iteration increments on death

7. AI v1 (Guidance)
- AI portrait/status widget
- Basic hints and system notices

8. Automation v1
- Repeatable task system
- Limited UI shortcuts for common actions

Out of scope for the slice:
- Corruption and convergence layers
- AI withholding/control behaviors
- Sealed wings and late-game content
