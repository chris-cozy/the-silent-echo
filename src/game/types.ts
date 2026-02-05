export type ResourceId = "heat" | "air" | "water" | "food" | "power";
export type RoomId = "dark_room" | "darkness";
export type ItemId = "band" | "tablet";

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
  | "DARKNESS"
  | "LOOK_UNLOCKED"
  | "REVEAL_1"
  | "BAND_AVAILABLE"
  | "BAND_TAKEN"
  | "REVEAL_3"
  | "NAV_UNLOCKED"
  | "DEATH_PENDING"
  | "DEMO_END";

export interface DarkRoomState {
  id: "dark_room";
  displayName: string;
  entered: boolean;
  lookUnlocked: boolean;
  revealStep: number;
  bandTaken: boolean;
  podRoomRevealed: boolean;
}

export interface DarknessRoomState {
  id: "darkness";
  displayName: string;
  entered: boolean;
  feelStep: number;
  lookStep: number;
  leverPulled: boolean;
  pullLeverUnlocked: boolean;
  partialDoorDiscovered: boolean;
  tabletDiscovered: boolean;
  tabletTaken: boolean;
  inspectTerminalsStep: number;
}

export interface InventoryState {
  items: ItemId[];
  resources: Record<string, number>;
}

export interface AiState {
  unlocked: boolean;
  status: "OFFLINE";
  reason: "EMERGENCY POWER RESERVES INSUFFICIENT";
  offlineAnnounced: boolean;
}

export interface GameState {
  runSeed: number;
  echoId: number;
  stage: IntroStage;
  started: boolean;
  currentRoomId: RoomId;
  playerName: string;
  rooms: {
    dark_room: DarkRoomState;
    darkness: DarknessRoomState;
  };
  inventory: InventoryState;
  ai: AiState;
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
