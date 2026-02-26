export type ResourceId = "heat" | "air" | "water" | "food" | "power";
export type RoomId =
  | "pod_room"
  | "control_room"
  | "central_hub"
  | "research_lab"
  | "power_station"
  | "maintenance_bay"
  | "life_support"
  | "airlock"
  | "living_quarters"
  | "restricted_lab"
  | "med_bay";
export type ItemId = "band" | "tablet" | "emergency_toolkit";
export type AllocationRoomId = "pod_room" | "control_room" | "life_support" | "med_bay" | "maintenance_bay" | "restricted_lab";

export interface RoomDef {
  id: string;
  name: string;
  adjacent: string[];
  powerCost: number;
  repairCost: number;
  starting?: boolean;
  grantsPowerCapacity?: number;
}

export interface EventDef {
  id: string;
  name: string;
  weight: number;
  delta: Partial<Record<ResourceId, number>>;
  log: string;
}

export interface RecipeDef {
  id: string;
  name: string;
  cost: Record<string, number>;
  effect: Partial<Record<ResourceId | "heatMax" | "airMax" | "waterMax" | "foodMax" | "powerMax", number>>;
}

export interface DataBundle {
  rooms: RoomDef[];
  events: EventDef[];
  recipes: RecipeDef[];
}

export type IntroStage =
  | "LIFE_START"
  | "BOOTING"
  | "RUNNING"
  | "DEATH_PENDING"
  | "DEMO_END";

export interface PodRoomState {
  id: "pod_room";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  lookUnlocked: boolean;
  revealStep: number;
  bandTaken: boolean;
  podRoomRevealed: boolean;
}

export interface ControlRoomState {
  id: "control_room";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  feelStep: number;
  lookStep: number;
  leverPulled: boolean;
  pullLeverUnlocked: boolean;
  jammedDoorDiscovered: boolean;
  partialDoorDiscovered: boolean;
  tabletDiscovered: boolean;
  tabletTaken: boolean;
  inspectTerminalsStep: number;
}

export interface CentralHubState {
  id: "central_hub";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  lookStep: number;
  collapseTriggered: boolean;
  livingQuartersCollapsed: boolean;
  blockedDoorDiscovered: boolean;
  sealedDoorDiscovered: boolean;
  darkDoorwayDiscovered: boolean;
}

export interface ResearchLabState {
  id: "research_lab";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  lookStep: number;
  restrictedDoorDiscovered: boolean;
  maintenancePathDiscovered: boolean;
  powerPathDiscovered: boolean;
  restrictedDoorInspected: boolean;
  partialDoorDiscovered: boolean;
}

export interface PowerStationState {
  id: "power_station";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  lookStep: number;
  controlPanelFound: boolean;
  controlPanelInspected: boolean;
  allocationViewOpen: boolean;
}

export interface MaintenanceBayState {
  id: "maintenance_bay";
  displayName: string;
  descriptorName: string;
  trueName: string;
  discovered: boolean;
  entered: boolean;
  lookStep: number;
  movementInspected: boolean;
  droidInspected: boolean;
  toolkitUnlocked: boolean;
  toolkitFound: boolean;
  toolkitTaken: boolean;
  wiresRepaired: boolean;
}

export interface InventoryState {
  items: ItemId[];
  resources: Record<string, number>;
}

export interface AiState {
  unlocked: boolean;
  online: boolean;
  bootAnnounced: boolean;
  pendingGreeting: boolean;
  currentMessage: string;
  queryIndex: number;
  waitingForDroidInspection: boolean;
  blockedNoNewInfoShown: boolean;
  finalNoNewInfoShown: boolean;
  status: "OFFLINE" | "ONLINE";
  reason: "EMERGENCY POWER RESERVES INSUFFICIENT" | "EMERGENCY POWER RESERVES STABLE";
  offlineAnnounced: boolean;
}

export interface PowerState {
  totalEmergencyAdjustable: number;
  availableEmergency: number;
  emergencyAllocation: Record<AllocationRoomId, number>;
  generalAllocationUnlocked: boolean;
}

export interface GameState {
  runSeed: number;
  echoId: number;
  stage: IntroStage;
  started: boolean;
  currentRoomId: RoomId;
  playerName: string;
  rooms: {
    pod_room: PodRoomState;
    control_room: ControlRoomState;
    central_hub: CentralHubState;
    research_lab: ResearchLabState;
    power_station: PowerStationState;
    maintenance_bay: MaintenanceBayState;
  };
  inventory: InventoryState;
  ai: AiState;
  power: PowerState;
  heat: number;
  heatCap: number;
  health: number;
  maxHealth: number;
  timeMinutes: number;
  stokeCount: number;
  navUnlocked: boolean;
  demoComplete: boolean;
  thawLineShown: boolean;
  growsLineShown: boolean;
  warmLineShown: boolean;
  reserveLimitLogged: boolean;
}
