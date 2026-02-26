# Gameplay Systems (Current Demo)

## Intro and continuity

The run still opens with wake/boot and early survival pressure, then expands into a connected outpost traversal loop.

Core cadence:

1. survive via embers/heat
2. reveal POD ROOM and CONTROL ROOM details
3. unlock route into CENTRAL HUB
4. progress through RESEARCH LAB to POWER STATION
5. reallocate emergency power to restore Control Room AI
6. complete AI + maintenance chain to acquire Emergency Toolkit (demo end)

## Survival loop

- Heat drains continuously.
- At `heat == 0`, health drains (`-1` every 2s) and freeze warnings appear.
- At `heat > 0`, health regenerates (`+1` every 3s).
- `STOKE EMBERS` has a 2s cooldown and upgrades heat reserve over repeated use.

## Graph traversal + blocked paths

Navigation is edge-constrained and room-local:

- Connected open edges are enterable.
- Jammed/sealed/collapsed paths remain visible but blocked.
- On first Central Hub entry, Living Quarters collapses and is permanently blocked for this demo slice.

## Descriptor-first naming

Rooms begin with unknown descriptors and rename on discovery:

- `A SHADOWED PASSAGE -> CENTRAL HUB`
- `A RUINED SPACE -> RESEARCH LAB`
- `A FLICKERING CHAMBER -> POWER STATION`

The display name is shared by room header and NAV entries.

## Power allocation

Power Station unlocks emergency allocation after panel discovery + inspection.

Emergency defaults:

- `pod_room: 1` (not benefiting)
- `control_room: 1`
- `life_support: 1` (not benefiting)
- `med_bay: 1` (not benefiting)
- `maintenance_bay: 1`
- `restricted_lab: 3` (locked)

Rules:

- Available pool starts at `0`.
- Pool increases only by deallocating adjustable rooms.
- Restricted Lab cannot be modified.
- Failure reasons are inspectable per failing room.

## Control Room threshold behavior

Hidden gate:

- `control_room >= 3` enables full control-room functionality and AI online path.
- dropping below threshold after boot regresses the room (dark interaction path and AI panel inaccessible).

## AI progression and branching

AI lifecycle:

1. unlocked offline via terminal inspection
2. offline panel shows percentage hint (based on control-room allocation)
3. online once control-room threshold is met
4. `QUERY` advances scripted lines

Branching condition:

- If `droid_inspected` already true, AI unlocks maintenance toolkit path immediately.
- Otherwise AI blocks until droid inspection is completed.

## Maintenance dependency chain

Maintenance slice currently models:

- low-power boot-loop cues
- droid inspection (`INSPECT MOVEMENT`)
- cable repair gate (requires toolkit + sufficient maintenance allocation)
- toolkit retrieval (`FEEL AROUND` -> `TAKE EMERGENCY TOOLKIT`)

Acquiring `Emergency Toolkit` adds it to STORAGE and triggers demo end modal.
