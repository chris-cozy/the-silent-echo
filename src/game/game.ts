import { UI } from "./ui.js";
import { createSeededRng, LogVariantService } from "./logVariants.js";
import {
  advanceTime,
  applyAction,
  applyEnterLocation,
  beginBoot,
  completeBoot,
  createInitialRuntime,
  createInitialState,
  deriveUiState,
  syncNow,
  ROOM_DARKNESS,
  ROOM_DARK_ROOM
} from "./engine.js";
import type { ActionCommand, EngineLogEvent, EngineRuntime } from "./engine.js";
import { GameState, RoomId } from "./types.js";

const BOOT_LINES = [
  "SYNCING ECHO MEMORY...",
  "CHECKING LIFE-SUPPORT BUS...",
  "RESTORING LOG CHANNEL...",
  "MANUAL CONTROL REQUIRED"
];

const INITIAL_ECHO_ID = 3;
const TICK_MS = 250;

export async function startGame(): Promise<void> {
  let game: Game | null = null;

  const ui = new UI(
    () => {
      if (game) {
        void game.wakeUp();
      }
    },
    (action) => {
      if (game) {
        game.handleAction(action);
      }
    },
    (targetId) => {
      if (game) {
        game.enterLocation(targetId);
      }
    },
    () => {
      if (game) {
        game.acknowledgeDeath();
      }
    },
    () => {
      if (game) {
        game.restartRun();
      }
    }
  );

  game = new Game(ui);
  game.init();

  if (import.meta.env.DEV) {
    (window as unknown as { __aseDebug?: Record<string, (...args: unknown[]) => void> }).__aseDebug = {
      boostVitals: () => {
        game?.debugBoostVitals();
      },
      unlockLook: () => {
        game?.debugUnlockLook();
      },
      jumpReveal3: () => {
        game?.debugJumpReveal3();
      },
      setHeat: (value: number) => {
        game?.debugSetHeat(value);
      },
      setHealth: (value: number) => {
        game?.debugSetHealth(value);
      },
      setHeatCap: (value: number) => {
        game?.debugSetHeatCap(value);
      },
      setTimeMinutes: (value: number) => {
        game?.debugSetTimeMinutes(value);
      },
      setRoom: (roomId: RoomId) => {
        game?.debugSetRoom(roomId);
      },
      setRevealStep: (step: number) => {
        game?.debugSetRevealStep(step);
      },
      setFeelStep: (step: number) => {
        game?.debugSetFeelStep(step);
      },
      setLookStep: (step: number) => {
        game?.debugSetLookStep(step);
      },
      setNavUnlocked: (value: boolean) => {
        game?.debugSetNavUnlocked(value);
      },
      setLeverPulled: (value: boolean) => {
        game?.debugSetLeverPulled(value);
      },
      setPullLeverUnlocked: (value: boolean) => {
        game?.debugSetPullLeverUnlocked(value);
      },
      setPartialDoorDiscovered: (value: boolean) => {
        game?.debugSetPartialDoorDiscovered(value);
      },
      setTabletTaken: (value: boolean) => {
        game?.debugSetTabletTaken(value);
      },
      fastForward: (ms: number) => {
        game?.debugAdvanceTime(ms);
      },
      pauseLoop: () => {
        game?.debugPauseLoop();
      },
      resumeLoop: () => {
        game?.debugResumeLoop();
      }
    };
  }
}

class Game {
  private ui: UI;
  private state: GameState;
  private runtime: EngineRuntime;
  private currentEchoId: number;
  private pendingDeathEchoId: number | null;
  private rng: () => number;
  private logVariants: LogVariantService;
  private loopTimer: number | null;
  private lastTickMs: number;

  constructor(ui: UI) {
    this.ui = ui;
    this.currentEchoId = INITIAL_ECHO_ID;
    this.pendingDeathEchoId = null;
    this.state = createInitialState(this.currentEchoId);
    this.rng = createSeededRng(this.state.runSeed);
    this.runtime = createInitialRuntime(this.rng, Date.now());
    this.logVariants = new LogVariantService(this.rng);
    this.loopTimer = null;
    this.lastTickMs = Date.now();
  }

  init(): void {
    this.ui.clearLogs();
    this.ui.setWakeVisible(true);
    this.ui.setDemoVisible(false);
    this.ui.setDeathVisible(false);
    this.render();
    this.stopLoop();
  }

  async wakeUp(): Promise<void> {
    if (this.state.stage !== "LIFE_START") {
      return;
    }

    beginBoot(this.state);
    this.ui.setWakeVisible(false);
    await this.ui.playBootSequence(BOOT_LINES);

    const outcome = completeBoot(this.state);
    this.applyLogs(outcome.logs);
    this.startLoop();
    this.render();
  }

  restartRun(): void {
    this.stopLoop();
    this.state = createInitialState(this.currentEchoId);
    this.rng = createSeededRng(this.state.runSeed);
    this.runtime = createInitialRuntime(this.rng, Date.now());
    this.logVariants = new LogVariantService(this.rng);
    this.pendingDeathEchoId = null;
    this.ui.clearLogs();
    this.ui.setDemoVisible(false);
    this.ui.setDeathVisible(false);
    this.ui.setWakeVisible(true);
    this.render();
  }

  acknowledgeDeath(): void {
    if (this.pendingDeathEchoId === null || this.state.stage !== "DEATH_PENDING") {
      return;
    }

    this.currentEchoId = this.pendingDeathEchoId;
    this.pendingDeathEchoId = null;
    this.restartRun();
  }

  handleAction(action: string): void {
    syncNow(this.runtime, Date.now());
    const outcome = applyAction(this.state, this.runtime, action as ActionCommand);
    this.applyLogs(outcome.logs);
    this.render();
  }

  enterLocation(targetId: string): void {
    const prevStage = this.state.stage;
    const outcome = applyEnterLocation(this.state, targetId);
    this.applyLogs(outcome.logs);

    if (prevStage !== "DEMO_END" && this.state.stage === "DEMO_END") {
      this.stopLoop();
      this.ui.setDemoVisible(true);
    }

    this.render();
  }

  debugBoostVitals(): void {
    this.state.started = true;
    this.state.heat = 35;
    this.state.health = 45;
    this.state.rooms.dark_room.lookUnlocked = true;
    if (this.state.stage === "LIFE_START") {
      this.state.stage = "LOOK_UNLOCKED";
      this.startLoop();
      this.ui.setWakeVisible(false);
    }
    this.render();
  }

  debugUnlockLook(): void {
    this.state.started = true;
    this.state.heat = 30;
    this.state.health = 30;
    this.state.rooms.dark_room.lookUnlocked = true;
    if (this.state.stage === "LIFE_START") {
      this.state.stage = "LOOK_UNLOCKED";
      this.startLoop();
      this.ui.setWakeVisible(false);
    }
    this.render();
  }

  debugJumpReveal3(): void {
    this.state.started = true;
    const darkRoom = this.state.rooms.dark_room;
    darkRoom.lookUnlocked = true;
    darkRoom.revealStep = 3;
    darkRoom.bandTaken = true;
    darkRoom.displayName = "A DARK ROOM";
    this.state.navUnlocked = true;
    this.state.currentRoomId = ROOM_DARK_ROOM;
    this.state.heatCap = 120;
    this.state.stage = "NAV_UNLOCKED";
    this.startLoop();
    this.ui.setWakeVisible(false);
    this.render();
  }

  debugSetHeat(value: number): void {
    this.state.heat = Math.max(0, value);
    this.render();
  }

  debugSetHealth(value: number): void {
    this.state.health = Math.max(0, Math.min(this.state.maxHealth, value));
    this.render();
  }

  debugSetHeatCap(value: number): void {
    this.state.heatCap = Math.max(1, value);
    this.render();
  }

  debugSetTimeMinutes(value: number): void {
    const total = 24 * 60;
    const wrapped = ((Math.floor(value) % total) + total) % total;
    this.state.timeMinutes = wrapped;
    this.render();
  }

  debugSetRoom(roomId: RoomId): void {
    if (roomId !== ROOM_DARK_ROOM && roomId !== ROOM_DARKNESS) {
      return;
    }
    this.state.currentRoomId = roomId;
    if (roomId === ROOM_DARKNESS) {
      this.state.rooms.darkness.entered = true;
    }
    this.render();
  }

  debugSetRevealStep(step: number): void {
    const clamped = Math.max(0, Math.min(3, Math.floor(step)));
    const darkRoom = this.state.rooms.dark_room;
    darkRoom.revealStep = clamped;
    if (clamped > 0) {
      darkRoom.lookUnlocked = true;
    }

    if (clamped === 0) {
      darkRoom.displayName = "DARKNESS";
      this.state.navUnlocked = false;
      this.state.stage = "DARKNESS";
    } else if (clamped === 1) {
      darkRoom.displayName = "A DARK SPACE";
      this.state.navUnlocked = false;
      this.state.stage = "REVEAL_1";
    } else if (clamped === 2) {
      darkRoom.displayName = "A DARK SPACE";
      this.state.navUnlocked = false;
      this.state.stage = darkRoom.bandTaken ? "BAND_TAKEN" : "BAND_AVAILABLE";
    } else {
      darkRoom.displayName = "A DARK ROOM";
      this.state.navUnlocked = true;
      this.state.stage = "NAV_UNLOCKED";
    }

    this.render();
  }

  debugSetFeelStep(step: number): void {
    const clamped = Math.max(0, Math.min(5, Math.floor(step)));
    const darkness = this.state.rooms.darkness;
    darkness.feelStep = clamped;
    darkness.pullLeverUnlocked = clamped >= 2;
    darkness.partialDoorDiscovered = clamped >= 4 || darkness.partialDoorDiscovered;
    darkness.tabletDiscovered = clamped >= 5 || darkness.tabletDiscovered;
    this.render();
  }

  debugSetLookStep(step: number): void {
    const clamped = Math.max(0, Math.min(4, Math.floor(step)));
    const darkness = this.state.rooms.darkness;
    darkness.lookStep = clamped;
    if (clamped >= 1) {
      darkness.displayName = "A DIMLY LIT ROOM";
    }
    if (clamped >= 3) {
      darkness.displayName = "TERMINAL ROOM";
    }
    if (clamped >= 2) {
      darkness.partialDoorDiscovered = true;
    }
    if (clamped >= 4) {
      darkness.tabletDiscovered = true;
    }
    this.render();
  }

  debugSetNavUnlocked(value: boolean): void {
    this.state.navUnlocked = value;
    if (value && this.state.stage === "DARKNESS") {
      this.state.stage = "NAV_UNLOCKED";
    }
    this.render();
  }

  debugSetLeverPulled(value: boolean): void {
    this.state.rooms.darkness.leverPulled = value;
    this.render();
  }

  debugSetPullLeverUnlocked(value: boolean): void {
    this.state.rooms.darkness.pullLeverUnlocked = value;
    this.render();
  }

  debugSetPartialDoorDiscovered(value: boolean): void {
    this.state.rooms.darkness.partialDoorDiscovered = value;
    this.render();
  }

  debugSetTabletTaken(value: boolean): void {
    const darkness = this.state.rooms.darkness;
    darkness.tabletDiscovered = darkness.tabletDiscovered || value;
    darkness.tabletTaken = value;
    this.state.playerName = value ? "???" : "_____";
    this.render();
  }

  debugAdvanceTime(ms: number): void {
    const outcome = advanceTime(this.state, this.runtime, Math.max(0, ms), this.rng);
    this.applyLogs(outcome.logs);
    if (this.state.stage === "DEATH_PENDING") {
      this.handleDeathTransition();
      return;
    }
    this.render();
  }

  debugPauseLoop(): void {
    this.stopLoop();
  }

  debugResumeLoop(): void {
    if (this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING") {
      return;
    }
    this.startLoop();
  }

  private startLoop(): void {
    if (this.loopTimer !== null) {
      return;
    }

    this.lastTickMs = Date.now();
    this.loopTimer = window.setInterval(() => this.tick(), TICK_MS);
  }

  private stopLoop(): void {
    if (this.loopTimer === null) {
      return;
    }

    window.clearInterval(this.loopTimer);
    this.loopTimer = null;
  }

  private tick(): void {
    const now = Date.now();
    const delta = now - this.lastTickMs;
    this.lastTickMs = now;

    const prevStage = this.state.stage;
    const outcome = advanceTime(this.state, this.runtime, delta, this.rng);
    this.applyLogs(outcome.logs);

    if (prevStage !== "DEATH_PENDING" && this.state.stage === "DEATH_PENDING") {
      this.handleDeathTransition();
      return;
    }

    this.render();
  }

  private handleDeathTransition(): void {
    const nextEchoId = this.state.echoId + 1;
    this.pendingDeathEchoId = nextEchoId;
    this.ui.setDeathMessage(
      `You died. ${this.formatEchoId(this.state.echoId)} terminated.\nAcknowledge to initialize ${this.formatEchoId(nextEchoId)}.`
    );
    this.ui.setDeathVisible(true);
    this.stopLoop();
    this.render();
  }

  private render(): void {
    syncNow(this.runtime, Date.now());
    const uiState = deriveUiState(this.state, this.runtime);
    this.ui.setEchoId(this.state.echoId);
    this.ui.setPlayerName(this.state.playerName);
    this.ui.setRoomTitle(uiState.roomTitle);
    this.ui.setActions(uiState.actions);
    this.ui.setVitals(this.state.rooms.dark_room.bandTaken, uiState.vitals);
    this.ui.setMap(false, "");
    this.ui.setNavigation(uiState.navigation);
    this.ui.setDeathVisible(this.state.stage === "DEATH_PENDING");
    this.ui.setDemoVisible(this.state.demoComplete);
  }

  private formatEchoId(echoId: number): string {
    return `Echo-${echoId.toString().padStart(2, "0")}`;
  }

  private applyLogs(logs: EngineLogEvent[]): void {
    for (const log of logs) {
      if (log.kind === "system") {
        this.ui.logSystem(this.logVariants.pick(log.key));
      } else if (log.sticky) {
        this.ui.logNarrative(this.logVariants.pickSticky(log.key));
      } else {
        this.ui.logNarrative(this.logVariants.pick(log.key));
      }
    }
  }
}
