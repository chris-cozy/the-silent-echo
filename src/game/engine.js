import { createRunSeed } from "./logVariants.js";
export const ROOM_DARK_ROOM = "dark_room";
export const ROOM_DARKNESS = "darkness";
export const NAV_PARTIAL_DOOR = "partial_door";
export const DARK_ROOM_LABEL = "A DARK ROOM";
export const DARKNESS_LABEL = "DARKNESS";
export const DARKNESS_DOORWAY_LABEL = "DARKNESS THROUGH THE DOORWAY";
export const PARTIAL_DOOR_LABEL = "PARTIALLY CLOSED DOORWAY INTO DARKNESS";
export const START_TIME_MINUTES = 3 * 60;
export const TIME_ADVANCE_MINUTES_PER_SECOND = 5;
export const STOKE_COOLDOWN_MS = 2000;
export const HEAT_DECAY_PER_SECOND = 1;
export const STOKE_HEAT_GAIN = 8;
export const STOKE_START_HEAT = 30;
export const STOKE_UPGRADE_EVERY = 3;
export const STOKE_CAP_LIMIT = 120;
export const STOKE_CAP_INCREMENT = 5;
export const HEALTH_REGEN_SECONDS = 3;
export const HEALTH_DRAIN_SECONDS = 2;
export const LOOK_UNLOCK_HEALTH = 12;
export const LOOK_UNLOCK_HEAT = 30;
export const AMBIENT_MIN_MS = 32000;
export const AMBIENT_MAX_MS = 65000;
export const AMBIENT_TRIGGER_CHANCE = 0.45;
export function createInitialState(echoId, runSeed = createRunSeed()) {
    return {
        runSeed,
        echoId,
        stage: "LIFE_START",
        started: false,
        currentRoomId: ROOM_DARK_ROOM,
        playerName: "_____",
        rooms: {
            dark_room: {
                id: "dark_room",
                displayName: "DARKNESS",
                entered: true,
                lookUnlocked: false,
                revealStep: 0,
                bandTaken: false,
                podRoomRevealed: false
            },
            darkness: {
                id: "darkness",
                displayName: "DARKNESS",
                entered: false,
                feelStep: 0,
                lookStep: 0,
                leverPulled: false,
                pullLeverUnlocked: false,
                partialDoorDiscovered: false,
                tabletDiscovered: false,
                tabletTaken: false,
                inspectTerminalsStep: 0
            }
        },
        inventory: {
            items: [],
            resources: {}
        },
        ai: {
            unlocked: false,
            status: "OFFLINE",
            reason: "EMERGENCY POWER RESERVES INSUFFICIENT",
            offlineAnnounced: false
        },
        heat: 0,
        heatCap: 20,
        health: 5,
        maxHealth: 100,
        timeMinutes: START_TIME_MINUTES,
        stokeCount: 0,
        navUnlocked: false,
        demoComplete: false,
        thawLineShown: false,
        growsLineShown: false,
        warmLineShown: false,
        reserveLimitLogged: false
    };
}
export function createInitialRuntime(rng, nowMs = 0) {
    return {
        nowMs,
        stokeCooldownUntilMs: 0,
        freezeAccumulatorMs: 0,
        heatDecayAccumulatorMs: 0,
        healthRegenAccumulatorMs: 0,
        timeAccumulatorMs: 0,
        freezeWarningAccumulatorMs: 0,
        ambientAccumulatorMs: 0,
        nextAmbientAtMs: randomBetween(rng, AMBIENT_MIN_MS, AMBIENT_MAX_MS)
    };
}
export function syncNow(runtime, nowMs) {
    runtime.nowMs = Math.max(runtime.nowMs, nowMs);
}
export function beginBoot(state) {
    if (state.stage !== "LIFE_START") {
        return;
    }
    state.stage = "BOOTING";
}
export function completeBoot(state) {
    const logs = [];
    if (state.stage !== "BOOTING") {
        return { logs };
    }
    state.stage = "DARKNESS";
    state.started = true;
    pushNarrative(logs, "wake_silent");
    pushNarrative(logs, "wake_machine");
    return { logs };
}
export function applyAction(state, runtime, action) {
    const logs = [];
    if (state.stage === "LIFE_START" ||
        state.stage === "BOOTING" ||
        state.stage === "DEATH_PENDING" ||
        state.stage === "DEMO_END") {
        return { logs };
    }
    switch (action) {
        case "stoke":
            stokeReactor(state, runtime, logs);
            break;
        case "look around":
            lookAround(state, logs);
            break;
        case "feel around":
            feelAround(state, logs);
            break;
        case "pull lever":
            pullLever(state, logs);
            break;
        case "inspect terminals":
            inspectTerminals(state, logs);
            break;
        case "take band":
            takeBand(state, logs);
            break;
        case "pick up tablet":
            pickUpTablet(state, logs);
            break;
        default:
            break;
    }
    return { logs };
}
export function applyEnterLocation(state, targetId) {
    const logs = [];
    if (!state.navUnlocked || state.stage === "DEMO_END" || state.stage === "DEATH_PENDING") {
        return { logs };
    }
    if (targetId === NAV_PARTIAL_DOOR) {
        state.stage = "DEMO_END";
        state.demoComplete = true;
        return { logs };
    }
    if (targetId !== ROOM_DARK_ROOM && targetId !== ROOM_DARKNESS) {
        return { logs };
    }
    if (state.currentRoomId === targetId) {
        return { logs };
    }
    state.currentRoomId = targetId;
    if (targetId === ROOM_DARKNESS) {
        if (!state.rooms.darkness.entered) {
            state.rooms.darkness.entered = true;
            pushNarrative(logs, "enter_darkness");
        }
        else {
            pushNarrative(logs, getReturnLogKeyForDarkness(state));
        }
    }
    if (targetId === ROOM_DARK_ROOM) {
        if (!state.rooms.dark_room.entered) {
            state.rooms.dark_room.entered = true;
        }
        else {
            pushNarrative(logs, getReturnLogKeyForDarkRoom(state));
        }
    }
    return { logs };
}
export function advanceTime(state, runtime, deltaMs, rng) {
    const logs = [];
    runtime.nowMs += deltaMs;
    if (!state.started || state.stage === "DEMO_END" || state.stage === "DEATH_PENDING") {
        return { logs };
    }
    applyTimeProgress(state, runtime, deltaMs);
    applyHeatAndHealth(state, runtime, deltaMs, logs);
    applyAmbientLogs(runtime, deltaMs, rng, logs);
    if (state.health <= 0) {
        pushSystem(logs, "death_flatline");
        pushNarrative(logs, "death_freeze");
        state.stage = "DEATH_PENDING";
    }
    return { logs };
}
export function deriveUiState(state, runtime) {
    return {
        roomTitle: getCurrentRoom(state).displayName,
        actions: getActionButtons(state, runtime),
        navigation: getNavigationState(state),
        vitals: getVitalsState(state),
        storage: getStorageState(state),
        aiPanel: getAiPanelState(state)
    };
}
export function getStokeCooldownRemainingMs(runtime) {
    return Math.max(0, runtime.stokeCooldownUntilMs - runtime.nowMs);
}
function stokeReactor(state, runtime, logs) {
    if (state.currentRoomId !== ROOM_DARK_ROOM) {
        return;
    }
    const remaining = getStokeCooldownRemainingMs(runtime);
    if (remaining > 0) {
        return;
    }
    const darkRoom = state.rooms.dark_room;
    if (state.stokeCount === 0) {
        state.heat = STOKE_START_HEAT;
        pushNarrative(logs, "stoke_first");
    }
    else {
        state.heat = Math.min(state.heatCap, state.heat + STOKE_HEAT_GAIN);
        pushNarrative(logs, "stoke_repeat", true);
    }
    state.stokeCount += 1;
    if (state.stokeCount % STOKE_UPGRADE_EVERY === 0 && state.heatCap < STOKE_CAP_LIMIT) {
        state.heatCap = Math.min(STOKE_CAP_LIMIT, state.heatCap + STOKE_CAP_INCREMENT);
        pushSystem(logs, "reserve_grows");
        if (state.heatCap === STOKE_CAP_LIMIT && !state.reserveLimitLogged) {
            state.reserveLimitLogged = true;
            pushSystem(logs, "reserve_limit");
        }
    }
    if (!state.thawLineShown && state.heat >= 10) {
        state.thawLineShown = true;
        pushNarrative(logs, "thaw_line");
    }
    if (!state.growsLineShown && state.heat >= 18) {
        state.growsLineShown = true;
        pushNarrative(logs, "heat_grows_line");
    }
    if (!state.warmLineShown && state.heat >= 26) {
        state.warmLineShown = true;
        pushNarrative(logs, "body_warms_line");
    }
    if (!darkRoom.lookUnlocked && state.heat > LOOK_UNLOCK_HEAT && state.health > LOOK_UNLOCK_HEALTH) {
        darkRoom.lookUnlocked = true;
        state.stage = "LOOK_UNLOCKED";
        pushNarrative(logs, "look_unlocked");
    }
    runtime.stokeCooldownUntilMs = runtime.nowMs + STOKE_COOLDOWN_MS;
}
function lookAround(state, logs) {
    if (state.currentRoomId === ROOM_DARK_ROOM) {
        lookAroundDarkRoom(state, logs);
    }
    else {
        lookAroundDarkness(state, logs);
    }
}
function takeBand(state, logs) {
    const darkRoom = state.rooms.dark_room;
    if (darkRoom.revealStep < 2 || darkRoom.bandTaken) {
        return;
    }
    darkRoom.bandTaken = true;
    state.stage = "BAND_TAKEN";
    addInventoryItem(state, "band");
    pushNarrative(logs, "band_taken");
}
function lookAroundDarkRoom(state, logs) {
    const darkRoom = state.rooms.dark_room;
    if (!darkRoom.lookUnlocked || state.heat === 0) {
        pushSystem(logs, "darkness_hides");
        return;
    }
    if (darkRoom.revealStep === 0) {
        darkRoom.revealStep = 1;
        darkRoom.displayName = "A DARK SPACE";
        state.stage = "REVEAL_1";
        pushNarrative(logs, "look_step_1");
        return;
    }
    if (darkRoom.revealStep === 1) {
        darkRoom.revealStep = 2;
        state.stage = "BAND_AVAILABLE";
        pushNarrative(logs, "look_step_2");
        return;
    }
    if (darkRoom.revealStep === 2) {
        darkRoom.revealStep = 3;
        darkRoom.displayName = DARK_ROOM_LABEL;
        state.navUnlocked = true;
        state.stage = "NAV_UNLOCKED";
        pushNarrative(logs, "look_step_3");
        return;
    }
    if (darkRoom.revealStep >= 3 && state.rooms.darkness.leverPulled && !darkRoom.podRoomRevealed) {
        darkRoom.podRoomRevealed = true;
        darkRoom.displayName = "POD ROOM";
        pushNarrative(logs, "pod_room_reveal");
        return;
    }
    pushNarrative(logs, "look_repeat");
}
function feelAround(state, logs) {
    if (state.currentRoomId !== ROOM_DARKNESS) {
        return;
    }
    const darknessRoom = state.rooms.darkness;
    if (darknessRoom.leverPulled) {
        pushNarrative(logs, "feel_repeat");
        return;
    }
    if (darknessRoom.feelStep === 0) {
        darknessRoom.feelStep = 1;
        pushNarrative(logs, "feel_step_1");
        return;
    }
    if (darknessRoom.feelStep === 1) {
        darknessRoom.feelStep = 2;
        darknessRoom.pullLeverUnlocked = true;
        pushNarrative(logs, "feel_step_2");
        return;
    }
    if (darknessRoom.feelStep === 2) {
        darknessRoom.feelStep = 3;
        pushNarrative(logs, "feel_step_3");
        return;
    }
    if (darknessRoom.feelStep === 3) {
        darknessRoom.feelStep = 4;
        darknessRoom.partialDoorDiscovered = true;
        pushNarrative(logs, "feel_step_4");
        return;
    }
    if (darknessRoom.feelStep === 4) {
        darknessRoom.feelStep = 5;
        darknessRoom.tabletDiscovered = true;
        pushNarrative(logs, "feel_step_5");
        return;
    }
    pushNarrative(logs, "feel_repeat");
}
function pullLever(state, logs) {
    if (state.currentRoomId !== ROOM_DARKNESS) {
        return;
    }
    const darknessRoom = state.rooms.darkness;
    if (!darknessRoom.pullLeverUnlocked || darknessRoom.leverPulled) {
        return;
    }
    darknessRoom.leverPulled = true;
    pushNarrative(logs, "pull_lever");
}
function inspectTerminals(state, logs) {
    if (state.currentRoomId !== ROOM_DARKNESS) {
        return;
    }
    const darknessRoom = state.rooms.darkness;
    if (darknessRoom.lookStep < 3) {
        return;
    }
    if (darknessRoom.inspectTerminalsStep === 0) {
        darknessRoom.inspectTerminalsStep = 1;
        pushNarrative(logs, "inspect_terminals_1");
        return;
    }
    if (darknessRoom.inspectTerminalsStep === 1) {
        darknessRoom.inspectTerminalsStep = 2;
        pushNarrative(logs, "inspect_terminals_2");
        state.ai.unlocked = true;
        if (!state.ai.offlineAnnounced) {
            state.ai.offlineAnnounced = true;
            pushSystem(logs, "ai_offline");
        }
        return;
    }
    pushNarrative(logs, "inspect_terminals_repeat");
}
function lookAroundDarkness(state, logs) {
    if (state.currentRoomId !== ROOM_DARKNESS) {
        return;
    }
    const darknessRoom = state.rooms.darkness;
    if (!darknessRoom.leverPulled) {
        pushNarrative(logs, "feel_repeat");
        return;
    }
    if (darknessRoom.lookStep === 0) {
        darknessRoom.lookStep = 1;
        darknessRoom.displayName = "A DIMLY LIT ROOM";
        pushNarrative(logs, "darkness_look_1");
        return;
    }
    if (darknessRoom.lookStep === 1) {
        darknessRoom.lookStep = 2;
        darknessRoom.partialDoorDiscovered = true;
        pushNarrative(logs, "darkness_look_2");
        return;
    }
    if (darknessRoom.lookStep === 2) {
        darknessRoom.lookStep = 3;
        darknessRoom.displayName = "TERMINAL ROOM";
        pushNarrative(logs, "darkness_look_3");
        return;
    }
    if (darknessRoom.lookStep === 3) {
        darknessRoom.lookStep = 4;
        if (!darknessRoom.tabletDiscovered && !darknessRoom.tabletTaken) {
            darknessRoom.tabletDiscovered = true;
            pushNarrative(logs, "darkness_look_4");
        }
        else {
            pushNarrative(logs, "darkness_look_4_docs");
        }
        return;
    }
    pushNarrative(logs, "darkness_look_repeat");
}
function pickUpTablet(state, logs) {
    if (state.currentRoomId !== ROOM_DARKNESS) {
        return;
    }
    const darknessRoom = state.rooms.darkness;
    if (!darknessRoom.tabletDiscovered || darknessRoom.tabletTaken) {
        return;
    }
    darknessRoom.tabletTaken = true;
    state.playerName = "???";
    addInventoryItem(state, "tablet");
    pushNarrative(logs, "tablet_pickup");
}
function applyTimeProgress(state, runtime, deltaMs) {
    runtime.timeAccumulatorMs += deltaMs;
    while (runtime.timeAccumulatorMs >= 1000) {
        runtime.timeAccumulatorMs -= 1000;
        state.timeMinutes += TIME_ADVANCE_MINUTES_PER_SECOND;
        if (state.timeMinutes >= 24 * 60) {
            state.timeMinutes -= 24 * 60;
        }
    }
}
function applyHeatAndHealth(state, runtime, deltaMs, logs) {
    runtime.freezeWarningAccumulatorMs += deltaMs;
    runtime.heatDecayAccumulatorMs += deltaMs;
    while (runtime.heatDecayAccumulatorMs >= 1000) {
        runtime.heatDecayAccumulatorMs -= 1000;
        if (state.heat > 0) {
            state.heat = Math.max(0, state.heat - HEAT_DECAY_PER_SECOND);
        }
    }
    if (state.heat === 0) {
        runtime.healthRegenAccumulatorMs = 0;
        runtime.freezeAccumulatorMs += deltaMs;
        if (runtime.freezeWarningAccumulatorMs >= 5000) {
            runtime.freezeWarningAccumulatorMs = 0;
            pushNarrative(logs, "freeze_warning");
        }
        while (runtime.freezeAccumulatorMs >= HEALTH_DRAIN_SECONDS * 1000) {
            runtime.freezeAccumulatorMs -= HEALTH_DRAIN_SECONDS * 1000;
            state.health = Math.max(0, state.health - 1);
        }
    }
    else {
        runtime.freezeAccumulatorMs = 0;
        runtime.freezeWarningAccumulatorMs = 0;
        runtime.healthRegenAccumulatorMs += deltaMs;
        while (runtime.healthRegenAccumulatorMs >= HEALTH_REGEN_SECONDS * 1000) {
            runtime.healthRegenAccumulatorMs -= HEALTH_REGEN_SECONDS * 1000;
            state.health = Math.min(state.maxHealth, state.health + 1);
        }
    }
    const darkRoom = state.rooms.dark_room;
    if (!darkRoom.lookUnlocked && state.heat > LOOK_UNLOCK_HEAT && state.health > LOOK_UNLOCK_HEALTH) {
        darkRoom.lookUnlocked = true;
        state.stage = "LOOK_UNLOCKED";
        pushNarrative(logs, "look_unlocked");
    }
}
function applyAmbientLogs(runtime, deltaMs, rng, logs) {
    runtime.ambientAccumulatorMs += deltaMs;
    if (runtime.ambientAccumulatorMs < runtime.nextAmbientAtMs) {
        return;
    }
    runtime.ambientAccumulatorMs = 0;
    runtime.nextAmbientAtMs = randomBetween(rng, AMBIENT_MIN_MS, AMBIENT_MAX_MS);
    if (rng() <= AMBIENT_TRIGGER_CHANCE) {
        pushNarrative(logs, "ambient_noise");
    }
}
function getActionButtons(state, runtime) {
    const buttons = [];
    const currentRoom = getCurrentRoom(state);
    if (currentRoom.id === ROOM_DARK_ROOM) {
        const stokeRemaining = getStokeCooldownRemainingMs(runtime);
        const cooldownActive = stokeRemaining > 0;
        buttons.push({
            command: "stoke",
            label: cooldownActive ? `STOKE EMBERS ${(stokeRemaining / 1000).toFixed(1)}s` : "STOKE EMBERS",
            disabled: cooldownActive,
            cooldownEndsAtMs: cooldownActive ? runtime.stokeCooldownUntilMs : undefined,
            cooldownDurationMs: STOKE_COOLDOWN_MS
        });
        if (currentRoom.lookUnlocked && state.heat !== 0) {
            buttons.push({ command: "look around", label: "LOOK AROUND" });
        }
        if (currentRoom.revealStep >= 2 && !currentRoom.bandTaken) {
            buttons.push({ command: "take band", label: "TAKE THE BAND" });
        }
    }
    if (currentRoom.id === ROOM_DARKNESS) {
        if (currentRoom.leverPulled) {
            buttons.push({ command: "look around", label: "LOOK AROUND" });
        }
        else {
            buttons.push({ command: "feel around", label: "FEEL AROUND" });
            if (currentRoom.pullLeverUnlocked && !currentRoom.leverPulled) {
                buttons.push({ command: "pull lever", label: "PULL LEVER" });
            }
        }
        if (currentRoom.lookStep >= 3) {
            buttons.push({ command: "inspect terminals", label: "INSPECT TERMINALS" });
        }
        if (currentRoom.tabletDiscovered && !currentRoom.tabletTaken) {
            buttons.push({ command: "pick up tablet", label: "PICK UP TABLET" });
        }
    }
    return buttons;
}
function getNavigationState(state) {
    if (!state.navUnlocked) {
        return { visible: false, entries: [] };
    }
    const entries = [
        {
            id: ROOM_DARK_ROOM,
            label: state.rooms.dark_room.displayName,
            isCurrent: state.currentRoomId === ROOM_DARK_ROOM,
            canEnter: state.currentRoomId !== ROOM_DARK_ROOM
        },
        {
            id: ROOM_DARKNESS,
            label: state.rooms.darkness.entered ? state.rooms.darkness.displayName : DARKNESS_DOORWAY_LABEL,
            isCurrent: state.currentRoomId === ROOM_DARKNESS,
            canEnter: state.currentRoomId !== ROOM_DARKNESS
        }
    ];
    if (state.rooms.darkness.partialDoorDiscovered) {
        entries.push({
            id: NAV_PARTIAL_DOOR,
            label: PARTIAL_DOOR_LABEL,
            isCurrent: false,
            canEnter: true
        });
    }
    return {
        visible: state.navUnlocked,
        entries
    };
}
function getVitalsState(state) {
    return {
        health: state.health,
        healthMax: state.maxHealth,
        heat: state.heat,
        heatMax: state.heatCap,
        time: formatTime(state.timeMinutes)
    };
}
function getStorageState(state) {
    const items = state.inventory.items.map((item) => formatItemLabel(item));
    const resources = Object.entries(state.inventory.resources)
        .filter(([, count]) => count > 0)
        .map(([id, count]) => ({ id, count }));
    const visible = items.length > 0 || resources.length > 0;
    return { visible, items, resources, showResources: resources.length > 0 };
}
function getAiPanelState(state) {
    return {
        visible: state.ai.unlocked,
        status: state.ai.status,
        reason: state.ai.reason
    };
}
function formatTime(totalMinutes) {
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const isPm = hours24 >= 12;
    const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
}
function getCurrentRoom(state) {
    return state.currentRoomId === ROOM_DARK_ROOM ? state.rooms.dark_room : state.rooms.darkness;
}
function getReturnLogKeyForDarkness(state) {
    const label = state.rooms.darkness.displayName;
    if (label === "A DIMLY LIT ROOM") {
        return "return_dimly_lit";
    }
    if (label === "TERMINAL ROOM") {
        return "return_terminal_room";
    }
    return "return_darkness";
}
function getReturnLogKeyForDarkRoom(state) {
    const label = state.rooms.dark_room.displayName;
    if (label === "A DARK SPACE") {
        return "return_dark_space";
    }
    if (label === DARK_ROOM_LABEL) {
        return "return_dark_room";
    }
    if (label === "POD ROOM") {
        return "return_pod_room";
    }
    return "return_darkness_room";
}
function addInventoryItem(state, item) {
    if (!state.inventory.items.includes(item)) {
        state.inventory.items.push(item);
    }
}
function formatItemLabel(item) {
    switch (item) {
        case "band":
            return "Vitals Band";
        case "tablet":
            return "Tablet";
        default:
            return item;
    }
}
function randomBetween(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
function pushSystem(logs, key) {
    logs.push({ kind: "system", key });
}
function pushNarrative(logs, key, sticky = false) {
    logs.push({ kind: "narrative", key, sticky });
}
