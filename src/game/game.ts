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
  ROOM_CONTROL_ROOM,
  ROOM_POD_ROOM,
  syncNow
} from "./engine.js";
import type { ActionCommand, EngineLogEvent, EngineRuntime } from "./engine.js";
import type { GameState, RoomId } from "./types.js";

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

  const tickToggle = document.getElementById("tick-toggle") as HTMLButtonElement | null;
  if (import.meta.env.DEV && tickToggle) {
    tickToggle.classList.remove("is-hidden");
    tickToggle.textContent = "PAUSE TICK";
    tickToggle.addEventListener("click", () => {
      if (!game) {
        return;
      }
      const running = game.toggleTickLoop();
      tickToggle.textContent = running ? "PAUSE TICK" : "RESUME TICK";
    });
  }

  if (import.meta.env.DEV) {
    const debugApi: DebugApi = {
      setRoom: (roomId: RoomId) => {
        game?.debugSetRoom(roomId);
      },
      setHeat: (value: number) => {
        game?.debugSetHeat(value);
      },
      setHealth: (value: number) => {
        game?.debugSetHealth(value);
      },
      setTimeMinutes: (value: number) => {
        game?.debugSetTimeMinutes(value);
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

    (window as unknown as { __aseDebug?: DebugApi }).__aseDebug = debugApi;
  }
}

type DebugApi = {
  setRoom: (roomId: RoomId) => void;
  setHeat: (value: number) => void;
  setHealth: (value: number) => void;
  setTimeMinutes: (value: number) => void;
  fastForward: (ms: number) => void;
  pauseLoop: () => void;
  resumeLoop: () => void;
};

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

    if (this.state.stage === "DEMO_END") {
      this.stopLoop();
      this.ui.setDemoVisible(true);
    }

    this.render();
  }

  enterLocation(targetId: string): void {
    const previousStage = this.state.stage;
    const outcome = applyEnterLocation(this.state, targetId);
    this.applyLogs(outcome.logs);

    if (previousStage !== "DEMO_END" && this.state.stage === "DEMO_END") {
      this.stopLoop();
      this.ui.setDemoVisible(true);
    }

    this.render();
  }

  debugSetRoom(roomId: RoomId): void {
    this.state.currentRoomId = roomId;
    if (roomId === ROOM_CONTROL_ROOM) {
      this.state.rooms.control_room.entered = true;
    }
    if (roomId === ROOM_POD_ROOM) {
      this.state.rooms.pod_room.entered = true;
    }
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

  debugSetTimeMinutes(value: number): void {
    const total = 24 * 60;
    const wrapped = ((Math.floor(value) % total) + total) % total;
    this.state.timeMinutes = wrapped;
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

  toggleTickLoop(): boolean {
    if (this.loopTimer === null) {
      if (this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING" || !this.state.started) {
        return false;
      }
      this.startLoop();
      return true;
    }

    this.stopLoop();
    return false;
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

    const previousStage = this.state.stage;
    const outcome = advanceTime(this.state, this.runtime, delta, this.rng);
    this.applyLogs(outcome.logs);

    if (previousStage !== "DEATH_PENDING" && this.state.stage === "DEATH_PENDING") {
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
    this.ui.setVitals(this.state.rooms.pod_room.bandTaken, uiState.vitals);
    this.ui.setStorage(uiState.storage);
    this.ui.setAiPanel(uiState.aiPanel);
    this.ui.setPowerPanel(uiState.powerPanel);
    this.ui.setMap(uiState.mapPanel.visible, uiState.mapPanel.text);
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
