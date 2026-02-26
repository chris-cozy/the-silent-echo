import { createRunSeed } from "./logVariants.js";
import type { AllocationRoomId, GameState, RoomId } from "./types.js";
import type { ActionButtonState, AiPanelState, MapPanelState, NavigationState, PowerPanelState, StorageState } from "./uiTypes.js";

export type ActionCommand = string;
export type LogKind = "system" | "narrative";

export interface EngineLogEvent {
  kind: LogKind;
  key: string;
  sticky?: boolean;
}

export interface EngineOutcome {
  logs: EngineLogEvent[];
}

export interface EngineRuntime {
  nowMs: number;
  stokeCooldownUntilMs: number;
  freezeAccumulatorMs: number;
  heatDecayAccumulatorMs: number;
  healthRegenAccumulatorMs: number;
  timeAccumulatorMs: number;
  freezeWarningAccumulatorMs: number;
  ambientAccumulatorMs: number;
  nextAmbientAtMs: number;
}

export interface UiState {
  roomTitle: string;
  actions: ActionButtonState[];
  navigation: NavigationState;
  vitals: { health: number; healthMax: number; heat: number; heatMax: number; time: string };
  storage: StorageState;
  aiPanel: AiPanelState;
  mapPanel: MapPanelState;
  powerPanel: PowerPanelState;
}

type EdgeState = "open" | "jammed" | "sealed" | "collapsed";

interface NavEdge {
  to: RoomId;
  state: EdgeState;
  viaLabel?: string;
}

const REAL_ROOMS: RoomId[] = ["pod_room", "control_room", "central_hub", "research_lab", "power_station", "maintenance_bay"];

export const ROOM_POD_ROOM = "pod_room" as const;
export const ROOM_CONTROL_ROOM = "control_room" as const;
export const ROOM_CENTRAL_HUB = "central_hub" as const;
export const ROOM_RESEARCH_LAB = "research_lab" as const;
export const ROOM_POWER_STATION = "power_station" as const;
export const ROOM_MAINTENANCE_BAY = "maintenance_bay" as const;

export const ROOM_DARK_ROOM = ROOM_POD_ROOM;
export const ROOM_DARKNESS = ROOM_CONTROL_ROOM;

export const NAV_PARTIAL_DOOR = "control_to_hub";

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

export const CONTROL_ROOM_POWER_MIN = 3;
export const MAINTENANCE_POWER_MIN = 2;

export const AMBIENT_MIN_MS = 32000;
export const AMBIENT_MAX_MS = 65000;
export const AMBIENT_TRIGGER_CHANCE = 0.2;

const ROOM_LABELS: Record<RoomId, string> = {
  pod_room: "POD ROOM",
  control_room: "CONTROL ROOM",
  central_hub: "CENTRAL HUB",
  research_lab: "RESEARCH ROOM",
  power_station: "POWER ROOM",
  maintenance_bay: "MAINTENANCE BAY",
  life_support: "LIFE SUPPORT",
  airlock: "AIRLOCK",
  living_quarters: "LIVING QUARTERS",
  restricted_lab: "RESTRICTED LAB",
  med_bay: "MED BAY"
};

const FAILURE_REASON_KEY_BY_ROOM: Record<string, string> = {
  pod_room: "alloc_failure_open_circuit",
  life_support: "alloc_failure_converter",
  med_bay: "alloc_failure_distribution"
};

const BASE_GRAPH: Record<RoomId, NavEdge[]> = {
  pod_room: [{ to: "control_room", state: "open" }],
  control_room: [
    { to: "pod_room", state: "open" },
    { to: "life_support", state: "jammed" },
    { to: "central_hub", state: "open" }
  ],
  central_hub: [
    { to: "control_room", state: "open" },
    { to: "research_lab", state: "open" },
    { to: "airlock", state: "sealed" },
    { to: "living_quarters", state: "collapsed" }
  ],
  research_lab: [
    { to: "central_hub", state: "open" },
    { to: "maintenance_bay", state: "open" },
    { to: "power_station", state: "open" },
    { to: "restricted_lab", state: "sealed" }
  ],
  power_station: [{ to: "research_lab", state: "open" }],
  maintenance_bay: [{ to: "research_lab", state: "open" }],
  life_support: [{ to: "control_room", state: "jammed" }],
  airlock: [{ to: "central_hub", state: "sealed" }],
  living_quarters: [{ to: "central_hub", state: "collapsed" }],
  restricted_lab: [{ to: "research_lab", state: "sealed" }],
  med_bay: []
};

export function createInitialState(echoId: number, runSeed: number = createRunSeed()): GameState {
  return {
    runSeed,
    echoId,
    stage: "LIFE_START",
    started: false,
    currentRoomId: ROOM_POD_ROOM,
    playerName: "_____",
    rooms: {
      pod_room: {
        id: "pod_room",
        displayName: "DARKNESS",
        descriptorName: "DARKNESS",
        trueName: "POD ROOM",
        discovered: false,
        entered: true,
        lookUnlocked: false,
        revealStep: 0,
        bandTaken: false,
        podRoomRevealed: false
      },
      control_room: {
        id: "control_room",
        displayName: "DARKNESS",
        descriptorName: "DARKNESS",
        trueName: "CONTROL ROOM",
        discovered: false,
        entered: false,
        feelStep: 0,
        lookStep: 0,
        leverPulled: false,
        pullLeverUnlocked: false,
        jammedDoorDiscovered: false,
        partialDoorDiscovered: false,
        tabletDiscovered: false,
        tabletTaken: false,
        inspectTerminalsStep: 0
      },
      central_hub: {
        id: "central_hub",
        displayName: "A DARK SPACE",
        descriptorName: "A DARK SPACE",
        trueName: "CENTRAL HUB",
        discovered: false,
        entered: false,
        lookStep: 0,
        collapseTriggered: false,
        livingQuartersCollapsed: false,
        blockedDoorDiscovered: false,
        sealedDoorDiscovered: false,
        darkDoorwayDiscovered: false
      },
      research_lab: {
        id: "research_lab",
        displayName: "A DIMLY LIT SPACE",
        descriptorName: "A DIMLY LIT SPACE",
        trueName: "RESEARCH ROOM",
        discovered: false,
        entered: false,
        lookStep: 0,
        restrictedDoorDiscovered: false,
        maintenancePathDiscovered: false,
        powerPathDiscovered: false,
        restrictedDoorInspected: false,
        partialDoorDiscovered: false
      },
      power_station: {
        id: "power_station",
        displayName: "A SERVICE PASSAGE",
        descriptorName: "A SERVICE PASSAGE",
        trueName: "POWER ROOM",
        discovered: false,
        entered: false,
        lookStep: 0,
        controlPanelFound: false,
        controlPanelInspected: false,
        allocationViewOpen: false
      },
      maintenance_bay: {
        id: "maintenance_bay",
        displayName: "A SERVICE PASSAGE",
        descriptorName: "A SERVICE PASSAGE",
        trueName: "MACHINE ROOM",
        discovered: false,
        entered: false,
        lookStep: 0,
        movementInspected: false,
        droidInspected: false,
        toolkitUnlocked: false,
        toolkitFound: false,
        toolkitTaken: false,
        wiresRepaired: false
      }
    },
    inventory: {
      items: [],
      resources: {}
    },
    ai: {
      unlocked: false,
      online: false,
      bootAnnounced: false,
      pendingGreeting: false,
      currentMessage: "",
      queryIndex: 0,
      waitingForDroidInspection: false,
      blockedNoNewInfoShown: false,
      finalNoNewInfoShown: false,
      status: "OFFLINE",
      reason: "EMERGENCY POWER RESERVES INSUFFICIENT",
      offlineAnnounced: false
    },
    power: {
      totalEmergencyAdjustable: 5,
      availableEmergency: 0,
      emergencyAllocation: {
        pod_room: 1,
        control_room: 1,
        life_support: 1,
        med_bay: 1,
        maintenance_bay: 1,
        restricted_lab: 3
      },
      generalAllocationUnlocked: false
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

export function createInitialRuntime(rng: () => number, nowMs = 0): EngineRuntime {
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

export function syncNow(runtime: EngineRuntime, nowMs: number): void {
  runtime.nowMs = Math.max(runtime.nowMs, nowMs);
}

export function beginBoot(state: GameState): void {
  if (state.stage !== "LIFE_START") {
    return;
  }
  state.stage = "BOOTING";
}

export function completeBoot(state: GameState): EngineOutcome {
  const logs: EngineLogEvent[] = [];
  if (state.stage !== "BOOTING") {
    return { logs };
  }
  state.stage = "RUNNING";
  state.started = true;
  pushNarrative(logs, "wake_silent");
  pushNarrative(logs, "wake_machine");
  return { logs };
}

export function applyAction(state: GameState, runtime: EngineRuntime, action: ActionCommand): EngineOutcome {
  const logs: EngineLogEvent[] = [];
  if (state.stage === "LIFE_START" || state.stage === "BOOTING" || state.stage === "DEATH_PENDING" || state.stage === "DEMO_END") {
    return { logs };
  }

  if (action.startsWith("allocation increase:")) {
    adjustAllocation(state, logs, action.slice("allocation increase:".length) as AllocationRoomId, 1);
    return { logs };
  }

  if (action.startsWith("allocation decrease:")) {
    adjustAllocation(state, logs, action.slice("allocation decrease:".length) as AllocationRoomId, -1);
    return { logs };
  }

  if (action.startsWith("inspect failure:")) {
    inspectFailureReason(logs, action.slice("inspect failure:".length));
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
    case "inspect restricted door":
      inspectRestrictedDoor(state, logs);
      break;
    case "inspect control panel":
      inspectControlPanel(state, logs);
      break;
    case "open power tab":
      if (state.currentRoomId !== ROOM_POWER_STATION || !state.rooms.power_station.controlPanelInspected) {
        pushSystem(logs, "allocation_room_required");
      }
      break;
    case "query":
      queryAi(state, logs);
      break;
    case "inspect movement":
      inspectMovement(state, logs);
      break;
    case "repair cables":
      repairCables(state, logs);
      break;
    case "take emergency toolkit":
      takeEmergencyToolkit(state, logs);
      break;
    default:
      break;
  }

  return { logs };
}

export function applyEnterLocation(state: GameState, targetId: string): EngineOutcome {
  const logs: EngineLogEvent[] = [];

  if (!state.navUnlocked || state.stage === "DEMO_END" || state.stage === "DEATH_PENDING") {
    return { logs };
  }

  const roomId = targetId as RoomId;
  if (!ROOM_LABELS[roomId]) {
    return { logs };
  }

  if (state.currentRoomId === roomId) {
    return { logs };
  }

  const edge = getEdge(state.currentRoomId, roomId, state);
  if (!edge) {
    return { logs };
  }

  if (!isEdgeDiscovered(state, state.currentRoomId, roomId)) {
    return { logs };
  }

  if (edge.state !== "open" || !REAL_ROOMS.includes(roomId)) {
    if (edge.state === "jammed") {
      pushSystem(logs, "door_jammed");
    } else if (edge.state === "sealed") {
      pushSystem(logs, "door_sealed");
    } else if (edge.state === "collapsed") {
      pushSystem(logs, "door_collapsed");
    }
    return { logs };
  }

  state.currentRoomId = roomId;

  if (roomId === "control_room") {
    const room = state.rooms.control_room;
    const first = !room.entered;
    room.entered = true;
    if (first) {
      pushNarrative(logs, "enter_darkness");
    } else {
      pushNarrative(logs, getReturnLogKeyForControlRoom(state));
    }
    if (state.ai.online && state.ai.pendingGreeting && !state.ai.bootAnnounced) {
      state.ai.bootAnnounced = true;
      state.ai.pendingGreeting = false;
      state.ai.currentMessage = "Hello, Cass.";
    }
    return { logs };
  }

  if (roomId === "pod_room") {
    const room = state.rooms.pod_room;
    const first = !room.entered;
    room.entered = true;
    pushNarrative(logs, first ? "enter_pod_room" : getReturnLogKeyForPodRoom(state));
    return { logs };
  }

  if (roomId === "central_hub") {
    const room = state.rooms.central_hub;
    const first = !room.entered;
    room.entered = true;
    pushNarrative(logs, first ? "enter_hub" : "return_hub");
    if (first && !room.collapseTriggered) {
      room.collapseTriggered = true;
      room.livingQuartersCollapsed = true;
      pushNarrative(logs, "hub_left_wing_movement");
      pushSystem(logs, "hub_debris_collapse");
    }
    return { logs };
  }

  if (roomId === "research_lab") {
    const room = state.rooms.research_lab;
    const first = !room.entered;
    room.entered = true;
    pushNarrative(logs, first ? "enter_dark_doorway" : getReturnLogKeyForResearchRoom(state));
    if (first) {
      pushNarrative(logs, "research_entry_movement");
    }
    return { logs };
  }

  if (roomId === "power_station") {
    const room = state.rooms.power_station;
    const first = !room.entered;
    room.entered = true;
    pushNarrative(logs, first ? "enter_service_power" : "return_service_power");
    return { logs };
  }

  if (roomId === "maintenance_bay") {
    const room = state.rooms.maintenance_bay;
    const first = !room.entered;
    room.entered = true;
    pushNarrative(logs, first ? "enter_service_machine" : "return_service_machine");
    if (first) {
      pushNarrative(logs, "maintenance_entry_loop");
    }
    return { logs };
  }

  return { logs };
}

export function advanceTime(state: GameState, runtime: EngineRuntime, deltaMs: number, rng: () => number): EngineOutcome {
  const logs: EngineLogEvent[] = [];
  runtime.nowMs += deltaMs;

  if (!state.started || state.stage === "DEMO_END" || state.stage === "DEATH_PENDING") {
    return { logs };
  }

  applyTimeProgress(state, runtime, deltaMs);
  applyHeatAndHealth(state, runtime, deltaMs, logs);
  applyAmbientLogs(state, runtime, deltaMs, rng, logs);

  if (state.health <= 0) {
    pushSystem(logs, "death_flatline");
    pushNarrative(logs, "death_freeze");
    state.stage = "DEATH_PENDING";
  }

  return { logs };
}

export function deriveUiState(state: GameState, runtime: EngineRuntime): UiState {
  return {
    roomTitle: getCurrentRoomDisplayName(state),
    actions: getActionButtons(state, runtime),
    navigation: getNavigationState(state),
    vitals: getVitalsState(state),
    storage: getStorageState(state),
    aiPanel: getAiPanelState(state),
    mapPanel: getMapPanelState(state),
    powerPanel: getPowerPanelState(state)
  };
}

export function getStokeCooldownRemainingMs(runtime: EngineRuntime): number {
  return Math.max(0, runtime.stokeCooldownUntilMs - runtime.nowMs);
}

function stokeReactor(state: GameState, runtime: EngineRuntime, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_POD_ROOM) {
    return;
  }

  const remaining = getStokeCooldownRemainingMs(runtime);
  if (remaining > 0) {
    return;
  }

  if (state.stokeCount === 0) {
    state.heat = STOKE_START_HEAT;
    pushNarrative(logs, "stoke_first");
  } else {
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

  const podRoom = state.rooms.pod_room;
  if (!podRoom.lookUnlocked && state.heat > LOOK_UNLOCK_HEAT && state.health > LOOK_UNLOCK_HEALTH) {
    podRoom.lookUnlocked = true;
    pushNarrative(logs, "look_unlocked");
  }

  runtime.stokeCooldownUntilMs = runtime.nowMs + STOKE_COOLDOWN_MS;
}

function lookAround(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId === ROOM_POD_ROOM) {
    lookAroundPodRoom(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_CONTROL_ROOM) {
    lookAroundControlRoom(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_CENTRAL_HUB) {
    lookAroundHub(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_RESEARCH_LAB) {
    lookAroundResearchLab(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_POWER_STATION) {
    lookAroundPowerStation(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_MAINTENANCE_BAY) {
    lookAroundMaintenance(state, logs);
  }
}

function takeBand(state: GameState, logs: EngineLogEvent[]): void {
  const podRoom = state.rooms.pod_room;
  if (state.currentRoomId !== ROOM_POD_ROOM || podRoom.revealStep < 2 || podRoom.bandTaken) {
    return;
  }

  podRoom.bandTaken = true;
  addInventoryItem(state, "band");
  pushNarrative(logs, "band_taken");
}

function lookAroundPodRoom(state: GameState, logs: EngineLogEvent[]): void {
  const podRoom = state.rooms.pod_room;
  if (!podRoom.lookUnlocked || state.heat === 0) {
    pushSystem(logs, "darkness_hides");
    return;
  }

  if (podRoom.revealStep === 0) {
    podRoom.revealStep = 1;
    podRoom.displayName = "A DARK SPACE";
    pushNarrative(logs, "look_step_1");
    return;
  }

  if (podRoom.revealStep === 1) {
    podRoom.revealStep = 2;
    pushNarrative(logs, "look_step_2");
    return;
  }

  if (podRoom.revealStep === 2) {
    podRoom.revealStep = 3;
    podRoom.displayName = "A DARK ROOM";
    state.navUnlocked = true;
    pushNarrative(logs, "look_step_3");
    return;
  }

  if (podRoom.revealStep >= 3 && state.rooms.control_room.leverPulled && !podRoom.podRoomRevealed) {
    podRoom.podRoomRevealed = true;
    podRoom.discovered = true;
    podRoom.displayName = podRoom.trueName;
    pushNarrative(logs, "pod_room_reveal");
    return;
  }

  pushNarrative(logs, "look_repeat");
}

function lookAroundControlRoom(state: GameState, logs: EngineLogEvent[]): void {
  const controlRoom = state.rooms.control_room;
  if (!controlRoom.leverPulled || !controlRoomVisualsActive(state)) {
    pushNarrative(logs, "feel_repeat");
    return;
  }

  if (controlRoom.lookStep === 0) {
    controlRoom.lookStep = 1;
    controlRoom.displayName = "A DIMLY LIT ROOM";
    pushNarrative(logs, "darkness_look_1");
    return;
  }

  if (controlRoom.lookStep === 1) {
    controlRoom.lookStep = 2;
    controlRoom.jammedDoorDiscovered = true;
    controlRoom.partialDoorDiscovered = true;
    pushNarrative(logs, "darkness_look_doors");
    return;
  }

  if (controlRoom.lookStep === 2) {
    controlRoom.lookStep = 3;
    controlRoom.displayName = "TERMINAL ROOM";
    pushNarrative(logs, "darkness_look_3");
    return;
  }

  if (controlRoom.lookStep === 3) {
    controlRoom.lookStep = 4;
    if (!controlRoom.tabletDiscovered && !controlRoom.tabletTaken) {
      controlRoom.tabletDiscovered = true;
      pushNarrative(logs, "darkness_look_4");
    } else {
      pushNarrative(logs, "darkness_look_4_docs");
    }
    return;
  }

  pushNarrative(logs, "darkness_look_repeat");
}

function lookAroundHub(state: GameState, logs: EngineLogEvent[]): void {
  const hub = state.rooms.central_hub;
  if (hub.lookStep === 0) {
    hub.lookStep = 1;
    pushNarrative(logs, "hub_look_1");
    return;
  }

  if (hub.lookStep === 1) {
    hub.lookStep = 2;
    hub.blockedDoorDiscovered = true;
    pushNarrative(logs, "hub_look_blocked_door");
    return;
  }

  if (hub.lookStep === 2) {
    hub.lookStep = 3;
    hub.sealedDoorDiscovered = true;
    pushNarrative(logs, "hub_look_sealed_door");
    return;
  }

  if (hub.lookStep === 3) {
    hub.lookStep = 4;
    hub.darkDoorwayDiscovered = true;
    hub.displayName = "A DARK HUB";
    hub.discovered = true;
    pushNarrative(logs, "hub_look_dark_doorway");
    return;
  }

  pushNarrative(logs, "hub_look_repeat");
}

function lookAroundResearchLab(state: GameState, logs: EngineLogEvent[]): void {
  const room = state.rooms.research_lab;
  if (room.lookStep === 0) {
    room.lookStep = 1;
    room.discovered = true;
    room.displayName = room.trueName;
    pushNarrative(logs, "research_look_1");
    return;
  }

  if (room.lookStep === 1) {
    room.lookStep = 2;
    room.restrictedDoorDiscovered = true;
    pushNarrative(logs, "research_look_restricted");
    return;
  }

  if (room.lookStep === 2) {
    room.lookStep = 3;
    room.maintenancePathDiscovered = true;
    pushNarrative(logs, "research_look_maintenance");
    return;
  }

  if (room.lookStep === 3) {
    room.lookStep = 4;
    room.powerPathDiscovered = true;
    pushNarrative(logs, "research_look_power");
    return;
  }

  pushNarrative(logs, "research_look_repeat");
}

function lookAroundPowerStation(state: GameState, logs: EngineLogEvent[]): void {
  const room = state.rooms.power_station;
  if (room.lookStep === 0) {
    room.lookStep = 1;
    room.discovered = true;
    pushNarrative(logs, "power_service_look_1");
    return;
  }

  if (room.lookStep === 1) {
    room.lookStep = 2;
    room.controlPanelFound = true;
    pushNarrative(logs, "power_service_look_2");
    return;
  }

  pushNarrative(logs, "power_service_look_repeat");
}

function lookAroundMaintenance(state: GameState, logs: EngineLogEvent[]): void {
  const room = state.rooms.maintenance_bay;
  if (room.lookStep === 0) {
    room.lookStep = 1;
    room.discovered = true;
    pushNarrative(logs, "machine_service_look_1");
    return;
  }

  if (room.lookStep === 1 && !room.movementInspected) {
    room.lookStep = 2;
    pushNarrative(logs, "machine_service_look_2");
    return;
  }

  if (room.movementInspected && room.displayName !== room.trueName) {
    room.displayName = room.trueName;
    pushNarrative(logs, "machine_service_look_post_inspect");
    return;
  }

  pushNarrative(logs, "machine_service_look_repeat");
}

function feelAround(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId === ROOM_CONTROL_ROOM) {
    feelAroundControlRoom(state, logs);
    return;
  }

  if (state.currentRoomId === ROOM_MAINTENANCE_BAY) {
    feelAroundMaintenance(state, logs);
  }
}

function feelAroundControlRoom(state: GameState, logs: EngineLogEvent[]): void {
  const controlRoom = state.rooms.control_room;
  if (controlRoomVisualsActive(state)) {
    pushNarrative(logs, "feel_repeat");
    return;
  }

  if (controlRoom.feelStep === 0) {
    controlRoom.feelStep = 1;
    pushNarrative(logs, "feel_step_1");
    return;
  }

  if (controlRoom.feelStep === 1) {
    controlRoom.feelStep = 2;
    controlRoom.pullLeverUnlocked = true;
    pushNarrative(logs, "feel_step_2");
    return;
  }

  if (controlRoom.feelStep === 2) {
    controlRoom.feelStep = 3;
    pushNarrative(logs, "feel_step_3");
    return;
  }

  if (controlRoom.feelStep === 3) {
    controlRoom.feelStep = 4;
    controlRoom.partialDoorDiscovered = true;
    pushNarrative(logs, "feel_step_4");
    return;
  }

  if (controlRoom.feelStep === 4) {
    controlRoom.feelStep = 5;
    controlRoom.tabletDiscovered = true;
    pushNarrative(logs, "feel_step_5");
    return;
  }

  pushNarrative(logs, "feel_repeat");
}

function feelAroundMaintenance(state: GameState, logs: EngineLogEvent[]): void {
  const room = state.rooms.maintenance_bay;
  if (room.toolkitUnlocked && !room.toolkitFound) {
    room.toolkitFound = true;
    pushNarrative(logs, "toolkit_found");
    return;
  }

  pushNarrative(logs, "maintenance_feel_repeat");
}

function pullLever(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_CONTROL_ROOM) {
    return;
  }

  const controlRoom = state.rooms.control_room;
  if (!controlRoom.pullLeverUnlocked || controlRoom.leverPulled) {
    return;
  }

  controlRoom.leverPulled = true;
  controlRoom.displayName = "A DIMLY LIT ROOM";
  pushNarrative(logs, "pull_lever");
}

function inspectTerminals(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_CONTROL_ROOM) {
    return;
  }

  const controlRoom = state.rooms.control_room;
  if (controlRoom.lookStep < 3) {
    return;
  }

  if (!controlRoomVisualsActive(state)) {
    pushSystem(logs, "terminals_dead");
    return;
  }

  if (controlRoom.inspectTerminalsStep === 0) {
    controlRoom.inspectTerminalsStep = 1;
    controlRoom.discovered = true;
    pushNarrative(logs, "inspect_terminals_1");
    return;
  }

  if (controlRoom.inspectTerminalsStep === 1) {
    controlRoom.inspectTerminalsStep = 2;
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

function pickUpTablet(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_CONTROL_ROOM) {
    return;
  }

  const room = state.rooms.control_room;
  if (!room.tabletDiscovered || room.tabletTaken) {
    return;
  }

  room.tabletTaken = true;
  state.playerName = "???";
  addInventoryItem(state, "tablet");
  pushNarrative(logs, "tablet_pickup");
}

function inspectRestrictedDoor(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_RESEARCH_LAB) {
    return;
  }

  const room = state.rooms.research_lab;
  if (!room.restrictedDoorDiscovered) {
    return;
  }
  if (!room.restrictedDoorInspected) {
    room.restrictedDoorInspected = true;
    pushNarrative(logs, "restricted_door_eye");
    return;
  }

  pushNarrative(logs, "restricted_door_repeat");
}

function inspectControlPanel(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_POWER_STATION) {
    return;
  }

  const room = state.rooms.power_station;
  if (!room.controlPanelFound) {
    return;
  }

  if (!room.controlPanelInspected) {
    room.controlPanelInspected = true;
    room.allocationViewOpen = true;
    room.displayName = room.trueName;
    state.rooms.control_room.displayName = state.rooms.control_room.trueName;
    state.rooms.control_room.discovered = true;
    pushNarrative(logs, "power_panel_inspected");
    return;
  }

  pushNarrative(logs, "power_panel_repeat");
}

function adjustAllocation(state: GameState, logs: EngineLogEvent[], roomId: AllocationRoomId, delta: -1 | 1): void {
  if (state.currentRoomId !== ROOM_POWER_STATION || !state.rooms.power_station.controlPanelInspected) {
    return;
  }

  if (roomId === "restricted_lab") {
    pushSystem(logs, "allocation_locked");
    return;
  }

  const current = state.power.emergencyAllocation[roomId];
  if (delta > 0) {
    if (state.power.availableEmergency <= 0) {
      pushSystem(logs, "allocation_no_power");
      return;
    }
    state.power.emergencyAllocation[roomId] = current + 1;
    state.power.availableEmergency -= 1;
    pushSystem(logs, "allocation_adjusted");
  } else {
    if (current <= 0) {
      return;
    }
    state.power.emergencyAllocation[roomId] = current - 1;
    state.power.availableEmergency += 1;
    pushSystem(logs, "allocation_adjusted");
  }

  applyAllocationEffects(state, logs);
}

function inspectFailureReason(logs: EngineLogEvent[], roomId: string): void {
  const key = FAILURE_REASON_KEY_BY_ROOM[roomId];
  if (!key) {
    return;
  }

  pushSystem(logs, key);
}

function queryAi(state: GameState, logs: EngineLogEvent[]): void {
  void logs;
  if (state.currentRoomId !== ROOM_CONTROL_ROOM || !state.ai.online) {
    return;
  }

  if (state.ai.queryIndex === 0) {
    state.ai.queryIndex = 1;
    state.ai.currentMessage = "It is good to see you up... but you are not safe...";
    return;
  }

  if (state.ai.queryIndex === 1) {
    state.ai.queryIndex = 2;
    state.ai.currentMessage = "Our first priority is getting you clothes. There should be some in the living quarters.";
    return;
  }

  if (state.ai.queryIndex === 2) {
    state.ai.queryIndex = 3;
    state.ai.currentMessage =
      "It is blocked by debris... I see. The maintenance droid should be able to take care of that for us.";
    return;
  }

  if (state.ai.queryIndex === 3) {
    if (state.rooms.maintenance_bay.droidInspected) {
      unlockToolkit(state, logs);
      state.ai.queryIndex = 5;
      state.ai.currentMessage =
        "Frayed wires... unfortunate... but repairable. I will unlock the emergency toolkit for you. It's in the maintenance bay.";
      return;
    }

    state.ai.waitingForDroidInspection = true;
    state.ai.queryIndex = 4;
    state.ai.currentMessage = "Check the maintenance bay for the droid...";
    return;
  }

  if (state.ai.queryIndex === 4) {
    if (state.rooms.maintenance_bay.droidInspected) {
      unlockToolkit(state, logs);
      state.ai.waitingForDroidInspection = false;
      state.ai.queryIndex = 5;
      state.ai.currentMessage =
        "Frayed wires... unfortunate... but repairable. I will unlock the emergency toolkit for you. It's in the maintenance bay.";
      return;
    }

    state.ai.currentMessage = "SYSTEM: You stare at the terminal screen, but no more messages appear.";
    return;
  }

  state.ai.currentMessage = "SYSTEM: You stare at the terminal screen, but no more messages appear.";
}

function unlockToolkit(state: GameState, logs: EngineLogEvent[]): void {
  if (!state.rooms.maintenance_bay.toolkitUnlocked) {
    state.rooms.maintenance_bay.toolkitUnlocked = true;
    state.rooms.maintenance_bay.displayName = "MAINTENANCE BAY";
    pushNarrative(logs, "ai_unlock_toolkit");
  } else {
    pushSystem(logs, "ai_query_finished");
  }
}

function inspectMovement(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_MAINTENANCE_BAY || state.rooms.maintenance_bay.lookStep === 0) {
    return;
  }

  const room = state.rooms.maintenance_bay;
  if (!room.movementInspected) {
    room.movementInspected = true;
    room.droidInspected = true;
    pushNarrative(logs, "machine_inspect_movement_unknown");
    if (!maintenancePowerActive(state)) {
      pushSystem(logs, "maintenance_power_low");
    }
    return;
  }

  pushNarrative(logs, room.toolkitUnlocked ? "maintenance_inspect_repeat_named" : "maintenance_inspect_repeat");
}

function repairCables(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_MAINTENANCE_BAY) {
    return;
  }

  const room = state.rooms.maintenance_bay;
  if (!room.droidInspected || room.wiresRepaired || !state.inventory.items.includes("emergency_toolkit")) {
    return;
  }

  room.wiresRepaired = true;
  pushNarrative(logs, "maintenance_repair_cables");

  if (maintenancePowerActive(state)) {
    pushSystem(logs, "maintenance_droid_boot");
  }
}

function takeEmergencyToolkit(state: GameState, logs: EngineLogEvent[]): void {
  if (state.currentRoomId !== ROOM_MAINTENANCE_BAY) {
    return;
  }

  const room = state.rooms.maintenance_bay;
  if (!room.toolkitFound || room.toolkitTaken) {
    return;
  }

  room.toolkitTaken = true;
  addInventoryItem(state, "emergency_toolkit");
  pushNarrative(logs, "toolkit_taken");
  state.demoComplete = true;
  state.stage = "DEMO_END";
}

function applyTimeProgress(state: GameState, runtime: EngineRuntime, deltaMs: number): void {
  runtime.timeAccumulatorMs += deltaMs;

  while (runtime.timeAccumulatorMs >= 1000) {
    runtime.timeAccumulatorMs -= 1000;
    state.timeMinutes += TIME_ADVANCE_MINUTES_PER_SECOND;
    if (state.timeMinutes >= 24 * 60) {
      state.timeMinutes -= 24 * 60;
    }
  }
}

function applyHeatAndHealth(state: GameState, runtime: EngineRuntime, deltaMs: number, logs: EngineLogEvent[]): void {
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
  } else {
    runtime.freezeAccumulatorMs = 0;
    runtime.freezeWarningAccumulatorMs = 0;
    runtime.healthRegenAccumulatorMs += deltaMs;

    while (runtime.healthRegenAccumulatorMs >= HEALTH_REGEN_SECONDS * 1000) {
      runtime.healthRegenAccumulatorMs -= HEALTH_REGEN_SECONDS * 1000;
      state.health = Math.min(state.maxHealth, state.health + 1);
    }
  }

  const podRoom = state.rooms.pod_room;
  if (!podRoom.lookUnlocked && state.heat > LOOK_UNLOCK_HEAT && state.health > LOOK_UNLOCK_HEALTH) {
    podRoom.lookUnlocked = true;
    pushNarrative(logs, "look_unlocked");
  }
}

function applyAmbientLogs(state: GameState, runtime: EngineRuntime, deltaMs: number, rng: () => number, logs: EngineLogEvent[]): void {
  runtime.ambientAccumulatorMs += deltaMs;
  if (runtime.ambientAccumulatorMs < runtime.nextAmbientAtMs) {
    return;
  }

  runtime.ambientAccumulatorMs = 0;
  runtime.nextAmbientAtMs = randomBetween(rng, AMBIENT_MIN_MS, AMBIENT_MAX_MS);
  if (rng() > AMBIENT_TRIGGER_CHANCE) {
    return;
  }

  if (state.currentRoomId === ROOM_CENTRAL_HUB) {
    pushNarrative(logs, "ambient_hub");
    return;
  }

  if (state.currentRoomId === ROOM_RESEARCH_LAB) {
    pushNarrative(logs, "ambient_research");
    return;
  }

  if (state.currentRoomId === ROOM_MAINTENANCE_BAY) {
    pushNarrative(logs, "ambient_maintenance");
    return;
  }

  pushNarrative(logs, "ambient_noise");
}

function applyAllocationEffects(state: GameState, logs: EngineLogEvent[]): void {
  void logs;
  const controlPower = getControlRoomAllocation(state);

  if (state.ai.unlocked) {
    if (controlPower >= CONTROL_ROOM_POWER_MIN) {
      if (!state.ai.online) {
        state.ai.online = true;
        state.ai.pendingGreeting = true;
        state.ai.status = "ONLINE";
        state.ai.reason = "EMERGENCY POWER RESERVES STABLE";
      }
    } else {
      if (state.ai.online) {
        state.ai.online = false;
        state.ai.pendingGreeting = false;
        state.ai.status = "OFFLINE";
        state.ai.reason = "EMERGENCY POWER RESERVES INSUFFICIENT";
        state.ai.currentMessage = "";
      }
    }
  }
}

function getActionButtons(state: GameState, runtime: EngineRuntime): ActionButtonState[] {
  const buttons: ActionButtonState[] = [];

  if (state.currentRoomId === ROOM_POD_ROOM) {
    const stokeRemaining = getStokeCooldownRemainingMs(runtime);
    const cooldownActive = stokeRemaining > 0;
    buttons.push({
      command: "stoke",
      label: cooldownActive ? `STOKE EMBERS ${(stokeRemaining / 1000).toFixed(1)}s` : "STOKE EMBERS",
      disabled: cooldownActive,
      cooldownEndsAtMs: cooldownActive ? runtime.stokeCooldownUntilMs : undefined,
      cooldownDurationMs: STOKE_COOLDOWN_MS
    });

    if (state.rooms.pod_room.lookUnlocked && state.heat !== 0) {
      buttons.push({ command: "look around", label: "LOOK AROUND" });
    }

    if (state.rooms.pod_room.revealStep >= 2 && !state.rooms.pod_room.bandTaken) {
      buttons.push({ command: "take band", label: "TAKE THE BAND" });
    }

    return buttons;
  }

  if (state.currentRoomId === ROOM_CONTROL_ROOM) {
    const room = state.rooms.control_room;
    if (room.leverPulled && controlRoomVisualsActive(state)) {
      buttons.push({ command: "look around", label: "LOOK AROUND" });
    } else {
      buttons.push({ command: "feel around", label: "FEEL AROUND" });
      if (room.pullLeverUnlocked && !room.leverPulled) {
        buttons.push({ command: "pull lever", label: "PULL LEVER" });
      }
    }

    if (room.lookStep >= 3) {
      buttons.push({ command: "inspect terminals", label: "INSPECT TERMINALS" });
    }

    if (room.tabletDiscovered && !room.tabletTaken) {
      buttons.push({ command: "pick up tablet", label: "PICK UP TABLET" });
    }

    return buttons;
  }

  if (state.currentRoomId === ROOM_CENTRAL_HUB) {
    buttons.push({ command: "look around", label: "LOOK AROUND" });
    return buttons;
  }

  if (state.currentRoomId === ROOM_RESEARCH_LAB) {
    buttons.push({ command: "look around", label: "LOOK AROUND" });
    if (state.rooms.research_lab.restrictedDoorDiscovered) {
      buttons.push({ command: "inspect restricted door", label: "INSPECT RESTRICTED DOOR" });
    }
    return buttons;
  }

  if (state.currentRoomId === ROOM_POWER_STATION) {
    const room = state.rooms.power_station;
    buttons.push({ command: "look around", label: "LOOK AROUND" });
    if (room.controlPanelFound) {
      buttons.push({ command: "inspect control panel", label: "INSPECT CONTROL PANEL" });
    }

    return buttons;
  }

  if (state.currentRoomId === ROOM_MAINTENANCE_BAY) {
    const room = state.rooms.maintenance_bay;
    buttons.push({ command: "look around", label: "LOOK AROUND" });

    if (room.lookStep >= 1) {
      buttons.push({ command: "inspect movement", label: "INSPECT MOVEMENT" });
    }

    if (room.toolkitUnlocked && !room.toolkitFound) {
      buttons.push({ command: "feel around", label: "FEEL AROUND" });
    }

    if (room.toolkitFound && !room.toolkitTaken) {
      buttons.push({ command: "take emergency toolkit", label: "TAKE EMERGENCY TOOLKIT" });
    }

    if (room.droidInspected && !room.wiresRepaired) {
      buttons.push({
        command: "repair cables",
        label: "REPAIR CABLES",
        disabled: !state.inventory.items.includes("emergency_toolkit")
      });
    }

    return buttons;
  }

  return buttons;
}

function getNavigationState(state: GameState): NavigationState {
  if (!state.navUnlocked) {
    return { visible: false, entries: [] };
  }

  type NavDescriptor = {
    id: string;
    visible: () => boolean;
    label: () => string;
    actionLabel?: () => string;
    canEnter?: () => boolean;
  };

  const descriptors: NavDescriptor[] = [
    {
      id: ROOM_POD_ROOM,
      visible: () => true,
      label: () => state.rooms.pod_room.displayName
    },
    {
      id: ROOM_CONTROL_ROOM,
      visible: () => true,
      label: () => state.rooms.control_room.displayName
    },
    {
      id: "life_support",
      visible: () => state.rooms.control_room.jammedDoorDiscovered,
      label: () => "JAMMED DOOR",
      actionLabel: () => "JAMMED",
      canEnter: () => false
    },
    {
      id: ROOM_CENTRAL_HUB,
      visible: () => state.rooms.control_room.partialDoorDiscovered,
      label: () => state.rooms.central_hub.displayName
    },
    {
      id: "living_quarters",
      visible: () => state.rooms.central_hub.blockedDoorDiscovered,
      label: () => (state.rooms.maintenance_bay.toolkitUnlocked ? "BLOCKED LIVING QUARTERS DOOR" : "BLOCKED DOOR"),
      actionLabel: () => "BLOCKED",
      canEnter: () => false
    },
    {
      id: "airlock",
      visible: () => state.rooms.central_hub.sealedDoorDiscovered,
      label: () => "SEALED DOOR",
      actionLabel: () => "SEALED",
      canEnter: () => false
    },
    {
      id: ROOM_RESEARCH_LAB,
      visible: () => state.rooms.central_hub.darkDoorwayDiscovered,
      label: () => (state.rooms.research_lab.entered ? state.rooms.research_lab.displayName : "DARK DOORWAY")
    },
    {
      id: ROOM_MAINTENANCE_BAY,
      visible: () => state.rooms.research_lab.maintenancePathDiscovered,
      label: () => state.rooms.maintenance_bay.displayName
    },
    {
      id: ROOM_POWER_STATION,
      visible: () => state.rooms.research_lab.powerPathDiscovered,
      label: () => state.rooms.power_station.displayName
    },
    {
      id: "restricted_lab",
      visible: () => state.rooms.research_lab.restrictedDoorDiscovered,
      label: () => "BLAST-SEALED DOOR",
      actionLabel: () => "SEALED",
      canEnter: () => false
    }
  ];

  const entries: NavigationState["entries"] = [];
  for (const descriptor of descriptors) {
    if (!descriptor.visible()) {
      continue;
    }

    const id = descriptor.id;
    const isCurrent = id === state.currentRoomId;
    let canEnter = false;
    let actionLabel = "UNREACHABLE";

    if (descriptor.canEnter) {
      canEnter = descriptor.canEnter();
      actionLabel = descriptor.actionLabel ? descriptor.actionLabel() : canEnter ? "ENTER" : "UNREACHABLE";
    } else if (isCurrent) {
      canEnter = false;
    } else {
      const edge = getEdge(state.currentRoomId, id as RoomId, state);
      canEnter = Boolean(edge && edge.state === "open" && isEdgeDiscovered(state, state.currentRoomId, id as RoomId));
      actionLabel = canEnter ? "ENTER" : "UNREACHABLE";
    }

    entries.push({
      id,
      label: descriptor.label(),
      isCurrent,
      canEnter,
      actionLabel: isCurrent ? undefined : descriptor.actionLabel ? descriptor.actionLabel() : actionLabel
    });
  }

  return { visible: true, entries };
}

function getVitalsState(state: GameState): { health: number; healthMax: number; heat: number; heatMax: number; time: string } {
  return {
    health: state.health,
    healthMax: state.maxHealth,
    heat: state.heat,
    heatMax: state.heatCap,
    time: formatTime(state.timeMinutes)
  };
}

function getStorageState(state: GameState): StorageState {
  const items = state.inventory.items.map((item) => formatItemLabel(item));
  const resources = Object.entries(state.inventory.resources)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ id, count }));
  const visible = items.length > 0 || resources.length > 0;
  return { visible, items, resources, showResources: resources.length > 0 };
}

function getAiPanelState(state: GameState): AiPanelState {
  if (!state.ai.unlocked) {
    return { visible: false, status: "OFFLINE", reason: "EMERGENCY POWER RESERVES INSUFFICIENT", message: "", queryAvailable: false };
  }

  const controlPower = getControlRoomAllocation(state);
  const shouldHideForRegression = state.ai.bootAnnounced && controlPower < CONTROL_ROOM_POWER_MIN;
  if (shouldHideForRegression) {
    return { visible: false, status: "OFFLINE", reason: "EMERGENCY POWER RESERVES INSUFFICIENT", message: "", queryAvailable: false };
  }

  if (state.ai.online) {
    return {
      visible: true,
      status: "ONLINE",
      reason: "EMERGENCY POWER RESERVES STABLE",
      message: state.ai.currentMessage,
      queryAvailable: state.currentRoomId === ROOM_CONTROL_ROOM
    };
  }

  const fraction = Math.max(0, Math.min(100, Math.round((controlPower / CONTROL_ROOM_POWER_MIN) * 100)));
  return {
    visible: true,
    status: "OFFLINE",
    reason: `EMERGENCY POWER RESERVES INSUFFICIENT (${fraction}%)`,
    message: "",
    queryAvailable: false
  };
}

function getPowerPanelState(state: GameState): PowerPanelState {
  const unlocked = state.rooms.power_station.controlPanelInspected;
  const rows = (["pod_room", "control_room", "life_support", "med_bay", "maintenance_bay", "restricted_lab"] as AllocationRoomId[]).map(
    (roomId) => {
      const units = state.power.emergencyAllocation[roomId];
      const locked = roomId === "restricted_lab";
      return {
        id: roomId,
        label:
          roomId === "restricted_lab"
            ? "Restricted Lab"
            : roomId === "pod_room"
              ? state.rooms.pod_room.displayName
              : roomId === "control_room"
                ? state.rooms.control_room.displayName
                : roomId === "maintenance_bay"
                  ? state.rooms.maintenance_bay.displayName
                  : roomId === "life_support"
                    ? "Life Support"
                    : "Med Bay",
        units,
        locked,
        canIncrease: !locked && state.power.availableEmergency > 0,
        canDecrease: !locked && units > 0,
        warningInspectable: Boolean(FAILURE_REASON_KEY_BY_ROOM[roomId])
      };
    }
  );

  return {
    unlocked,
    inPowerRoom: state.currentRoomId === ROOM_POWER_STATION,
    availablePower: state.power.availableEmergency,
    rows
  };
}

function getMapPanelState(state: GameState): MapPanelState {
  return { visible: false, text: "" };
}

function getCurrentRoomDisplayName(state: GameState): string {
  if (state.currentRoomId === "pod_room") {
    return state.rooms.pod_room.displayName;
  }
  if (state.currentRoomId === "control_room") {
    return state.rooms.control_room.displayName;
  }
  if (state.currentRoomId === "central_hub") {
    return state.rooms.central_hub.displayName;
  }
  if (state.currentRoomId === "research_lab") {
    return state.rooms.research_lab.displayName;
  }
  if (state.currentRoomId === "power_station") {
    return state.rooms.power_station.displayName;
  }
  if (state.currentRoomId === "maintenance_bay") {
    return state.rooms.maintenance_bay.displayName;
  }
  return ROOM_LABELS[state.currentRoomId];
}

function getRoomLabelForNav(roomId: RoomId, state: GameState): string {
  if (roomId === "pod_room") {
    return state.rooms.pod_room.displayName;
  }
  if (roomId === "control_room") {
    return state.rooms.control_room.displayName;
  }
  if (roomId === "central_hub") {
    return state.rooms.central_hub.displayName;
  }
  if (roomId === "research_lab") {
    return state.rooms.research_lab.displayName;
  }
  if (roomId === "power_station") {
    return state.rooms.power_station.displayName;
  }
  if (roomId === "maintenance_bay") {
    return state.rooms.maintenance_bay.displayName;
  }
  return ROOM_LABELS[roomId];
}

function getEdge(from: RoomId, to: RoomId, state: GameState): NavEdge | null {
  const edges = getEdgesForRoom(from, state);
  return edges.find((edge) => edge.to === to) ?? null;
}

function isEdgeDiscovered(state: GameState, from: RoomId, to: RoomId): boolean {
  if (from === ROOM_CONTROL_ROOM && to === "life_support") {
    return state.rooms.control_room.jammedDoorDiscovered;
  }
  if (from === ROOM_CONTROL_ROOM && to === ROOM_CENTRAL_HUB) {
    return state.rooms.control_room.partialDoorDiscovered;
  }
  if (from === ROOM_CENTRAL_HUB && to === "living_quarters") {
    return state.rooms.central_hub.blockedDoorDiscovered;
  }
  if (from === ROOM_CENTRAL_HUB && to === "airlock") {
    return state.rooms.central_hub.sealedDoorDiscovered;
  }
  if (from === ROOM_CENTRAL_HUB && to === ROOM_RESEARCH_LAB) {
    return state.rooms.central_hub.darkDoorwayDiscovered;
  }
  if (from === ROOM_RESEARCH_LAB && to === "restricted_lab") {
    return state.rooms.research_lab.restrictedDoorDiscovered;
  }
  if (from === ROOM_RESEARCH_LAB && to === ROOM_MAINTENANCE_BAY) {
    return state.rooms.research_lab.maintenancePathDiscovered;
  }
  if (from === ROOM_RESEARCH_LAB && to === ROOM_POWER_STATION) {
    return state.rooms.research_lab.powerPathDiscovered;
  }
  return true;
}

function getEdgesForRoom(roomId: RoomId, state: GameState): NavEdge[] {
  const edges = BASE_GRAPH[roomId] ?? [];

  if (roomId !== "central_hub") {
    return edges;
  }

  return edges.map((edge) => {
    if (edge.to === "living_quarters") {
      return {
        ...edge,
        state: state.rooms.central_hub.livingQuartersCollapsed ? "collapsed" : "open"
      };
    }
    return edge;
  });
}

function controlRoomVisualsActive(state: GameState): boolean {
  if (!state.rooms.control_room.leverPulled) {
    return false;
  }

  if (!state.ai.bootAnnounced) {
    return true;
  }

  return getControlRoomAllocation(state) >= CONTROL_ROOM_POWER_MIN;
}

function getControlRoomAllocation(state: GameState): number {
  return state.power.emergencyAllocation.control_room;
}

function maintenancePowerActive(state: GameState): boolean {
  return state.power.emergencyAllocation.maintenance_bay >= MAINTENANCE_POWER_MIN;
}

function getDoorStateLabel(state: EdgeState): string {
  if (state === "jammed") {
    return "JAMMED";
  }
  if (state === "sealed") {
    return "SEALED";
  }
  if (state === "collapsed") {
    return "COLLAPSED";
  }
  return "ENTER";
}

function formatTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const isPm = hours24 >= 12;
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
}

function addInventoryItem(state: GameState, item: "band" | "tablet" | "emergency_toolkit"): void {
  if (!state.inventory.items.includes(item)) {
    state.inventory.items.push(item);
  }
}

function formatItemLabel(item: string): string {
  switch (item) {
    case "band":
      return "Vitals Band";
    case "tablet":
      return "Tablet";
    case "emergency_toolkit":
      return "Emergency Toolkit";
    default:
      return item;
  }
}

function getReturnLogKeyForPodRoom(state: GameState): string {
  const label = state.rooms.pod_room.displayName;
  if (label === "A DARK SPACE") {
    return "return_dark_space";
  }
  if (label === "A DARK ROOM") {
    return "return_dark_room";
  }
  if (label === "POD ROOM") {
    return "return_pod_room";
  }
  return "return_darkness_room";
}

function getReturnLogKeyForControlRoom(state: GameState): string {
  const label = state.rooms.control_room.displayName;
  if (label === "A DIMLY LIT ROOM") {
    return "return_dimly_lit";
  }
  if (label === "TERMINAL ROOM") {
    return "return_terminal_room";
  }
  if (label === "CONTROL ROOM") {
    return "return_control_room";
  }
  return "return_darkness";
}

function getReturnLogKeyForResearchRoom(state: GameState): string {
  const label = state.rooms.research_lab.displayName;
  if (label === "A DIMLY LIT SPACE") {
    return "return_dimly_lit_space";
  }
  return "return_research_room";
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pushSystem(logs: EngineLogEvent[], key: string): void {
  logs.push({ kind: "system", key });
}

function pushNarrative(logs: EngineLogEvent[], key: string, sticky = false): void {
  logs.push({ kind: "narrative", key, sticky });
}
