import { ActionButtonState, NavigationState, UI } from "./ui.js";
import { GameState, IntroStage } from "./types.js";

const BOOT_LINES = [
  "SYNCING ECHO MEMORY...",
  "CHECKING LIFE-SUPPORT BUS...",
  "RESTORING LOG CHANNEL...",
  "MANUAL CONTROL REQUIRED"
];

const START_TIME_MINUTES = 3 * 60;
const TIME_ADVANCE_MINUTES_PER_SECOND = 5;

const STOKE_COOLDOWN_MS = 2000;
const HEAT_DECAY_PER_SECOND = 1;
const STOKE_HEAT_GAIN = 8;
const STOKE_START_HEAT = 30;
const STOKE_UPGRADE_EVERY = 3;
const STOKE_CAP_LIMIT = 120;
const STOKE_CAP_INCREMENT = 5;

const HEALTH_REGEN_SECONDS = 3;
const HEALTH_DRAIN_SECONDS = 2;
const LOOK_UNLOCK_HEALTH = 12;
const LOOK_UNLOCK_HEAT = 18;

const FREEZE_WARNING_LINES = [
  "You are freezing...",
  "Your skin is numb from the cold...",
  "The cold digs deeper into your bones..."
];

const WARMING_LINES = {
  thaw: "Your skin begins to thaw.",
  grows: "The heat grows...",
  warm: "Your body warms from the heat."
};

const LOOK_STEP_ONE_LINES = [
  "You look around. The glow from the reactor reveals the pod you climbed out of. The glass is cracked. The power is on reserve.",
  "You look around. Reactor light spills across the pod you climbed out of. The glass is fractured. The power is on reserve.",
  "You look around. In the faint reactor glow you spot the pod you climbed out of. Cracks web the glass. The power is on reserve."
];

const AMBIENT_LINES = [
  "You hear a faint scuttle from the darkness...",
  "You hear a sharp scratch from the darkness..."
];
const AMBIENT_MIN_MS = 32000;
const AMBIENT_MAX_MS = 65000;
const AMBIENT_TRIGGER_CHANCE = 0.45;

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
    () => {
      if (game) {
        game.enterDoorway();
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

  (window as unknown as { __aseDebug?: Record<string, () => void> }).__aseDebug = {
    boostVitals: () => {
      game?.debugBoostVitals();
    },
    unlockLook: () => {
      game?.debugUnlockLook();
    },
    jumpReveal3: () => {
      game?.debugJumpReveal3();
    }
  };
}

class Game {
  private ui: UI;
  private state: GameState;
  private loopTimer: number | null;
  private lastTickMs: number;
  private stokeCooldownUntilMs: number;
  private freezeAccumulatorMs: number;
  private heatDecayAccumulatorMs: number;
  private healthRegenAccumulatorMs: number;
  private timeAccumulatorMs: number;
  private freezeWarningAccumulatorMs: number;
  private ambientAccumulatorMs: number;
  private nextAmbientAtMs: number;

  constructor(ui: UI) {
    this.ui = ui;
    this.state = this.createInitialState();
    this.loopTimer = null;
    this.lastTickMs = Date.now();
    this.stokeCooldownUntilMs = 0;
    this.freezeAccumulatorMs = 0;
    this.heatDecayAccumulatorMs = 0;
    this.healthRegenAccumulatorMs = 0;
    this.timeAccumulatorMs = 0;
    this.freezeWarningAccumulatorMs = 0;
    this.ambientAccumulatorMs = 0;
    this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
  }

  init(): void {
    this.ui.clearLogs();
    this.ui.setWakeVisible(true);
    this.ui.setDemoVisible(false);
    this.render();
    this.stopLoop();
  }

  async wakeUp(): Promise<void> {
    if (this.state.stage !== "LIFE_START") {
      return;
    }

    this.transitionTo("BOOTING");
    this.ui.setWakeVisible(false);
    await this.ui.playBootSequence(BOOT_LINES);

    this.transitionTo("DARKNESS");
    this.ui.logNarrative("The darkness is silent...");
    this.ui.logNarrative("You see a machine in front of you, it's embers nearly dead...");
    this.startLoop();
    this.render();
  }

  restartRun(): void {
    this.stopLoop();
    this.resetRuntimeCounters();
    this.state = this.createInitialState();
    this.ui.clearLogs();
    this.ui.setDemoVisible(false);
    this.ui.setWakeVisible(true);
    this.render();
  }

  handleAction(action: string): void {
    if (this.state.stage === "LIFE_START" || this.state.stage === "BOOTING" || this.state.stage === "DEMO_END") {
      return;
    }

    switch (action) {
      case "stoke":
        this.stokeReactor();
        break;
      case "look around":
        this.lookAround();
        break;
      case "take band":
        this.takeBand();
        break;
      default:
        break;
    }

    this.render();
  }

  enterDoorway(): void {
    if (!this.state.navUnlocked || this.state.stage === "DEMO_END") {
      return;
    }

    this.transitionTo("DEMO_END");
    this.state.demoComplete = true;
    this.stopLoop();
    this.ui.setDemoVisible(true);
  }

  debugBoostVitals(): void {
    this.state.started = true;
    this.state.heat = 35;
    this.state.health = 45;
    this.state.lookUnlocked = true;
    if (this.state.stage === "LIFE_START") {
      this.transitionTo("LOOK_UNLOCKED");
      this.startLoop();
      this.ui.setWakeVisible(false);
    }
    this.render();
  }

  debugUnlockLook(): void {
    this.state.started = true;
    this.state.heat = 30;
    this.state.health = 30;
    this.state.lookUnlocked = true;
    if (this.state.stage === "LIFE_START") {
      this.transitionTo("LOOK_UNLOCKED");
      this.startLoop();
      this.ui.setWakeVisible(false);
    }
    this.render();
  }

  debugJumpReveal3(): void {
    this.state.started = true;
    this.state.lookUnlocked = true;
    this.state.revealStep = 3;
    this.state.bandTaken = true;
    this.state.navUnlocked = true;
    this.state.currentLocationLabel = "A DARK ROOM";
    this.state.heatCap = 120;
    this.transitionTo("NAV_UNLOCKED");
    this.startLoop();
    this.ui.setWakeVisible(false);
    this.render();
  }

  private createInitialState(): GameState {
    return {
      echoId: 3,
      stage: "LIFE_START",
      started: false,
      currentLocationLabel: "DARKNESS",
      heat: 0,
      heatCap: 20,
      health: 5,
      maxHealth: 100,
      timeMinutes: START_TIME_MINUTES,
      stokeCount: 0,
      lookUnlocked: false,
      revealStep: 0,
      bandTaken: false,
      navUnlocked: false,
      demoComplete: false,
      thawLineShown: false,
      growsLineShown: false,
      warmLineShown: false,
      reserveLimitLogged: false
    };
  }

  private transitionTo(next: IntroStage): void {
    this.state.stage = next;
  }

  private stokeReactor(): void {
    const remaining = this.getStokeCooldownRemainingMs();
    if (remaining > 0) {
      return;
    }

    if (!this.state.started) {
      this.state.started = true;
      this.state.heat = STOKE_START_HEAT;
      this.ui.logNarrative("You stoke the glowing embers in the reactor before you...");
    } else {
      this.state.heat = Math.min(this.state.heatCap, this.state.heat + STOKE_HEAT_GAIN);
      this.ui.logNarrative("You feed the reactor and hold your hands over the heat.");
    }

    this.state.stokeCount += 1;

    if (this.state.stokeCount % STOKE_UPGRADE_EVERY === 0 && this.state.heatCap < STOKE_CAP_LIMIT) {
      this.state.heatCap = Math.min(STOKE_CAP_LIMIT, this.state.heatCap + STOKE_CAP_INCREMENT);
      this.ui.logSystem("Reactor reserve grows stronger");

      if (this.state.heatCap === STOKE_CAP_LIMIT && !this.state.reserveLimitLogged) {
        this.state.reserveLimitLogged = true;
        this.ui.logSystem("Reactor reserve has reached its limit");
      }
    }

    if (!this.state.thawLineShown && this.state.heat >= 10) {
      this.state.thawLineShown = true;
      this.ui.logNarrative(WARMING_LINES.thaw);
    }

    if (!this.state.growsLineShown && this.state.heat >= 18) {
      this.state.growsLineShown = true;
      this.ui.logNarrative(WARMING_LINES.grows);
    }

    if (!this.state.warmLineShown && this.state.heat >= 26) {
      this.state.warmLineShown = true;
      this.ui.logNarrative(WARMING_LINES.warm);
    }

    if (!this.state.lookUnlocked && this.state.heat >= LOOK_UNLOCK_HEAT && this.state.health > LOOK_UNLOCK_HEALTH) {
      this.state.lookUnlocked = true;
      this.transitionTo("LOOK_UNLOCKED");
      this.ui.logNarrative("Your eyes adjust to the faint light from the reactor.");
    }

    this.stokeCooldownUntilMs = Date.now() + STOKE_COOLDOWN_MS;
  }

  private lookAround(): void {
    if (!this.state.lookUnlocked || this.state.heat === 0) {
      this.ui.logSystem("The darkness hides everything");
      return;
    }

    if (this.state.revealStep === 0) {
      this.state.revealStep = 1;
      this.state.currentLocationLabel = "A DARK SPACE";
      this.transitionTo("REVEAL_1");
      this.ui.logNarrative(this.pickOne(LOOK_STEP_ONE_LINES));
      return;
    }

    if (this.state.revealStep === 1) {
      this.state.revealStep = 2;
      this.transitionTo("BAND_AVAILABLE");
      this.ui.logNarrative("You notice a dark band on the ground next to the large device.");
      return;
    }

    if (this.state.revealStep === 2) {
      this.state.revealStep = 3;
      this.state.currentLocationLabel = "A DARK ROOM";
      this.state.navUnlocked = true;
      this.transitionTo("NAV_UNLOCKED");
      this.ui.logNarrative(
        "You notice walls all around you... you are in a room... a few feet away you see a doorway leading into darkness."
      );
      return;
    }

    this.ui.logNarrative("You look around again, but don't notice anything new...");
  }

  private takeBand(): void {
    if (this.state.revealStep < 2 || this.state.bandTaken) {
      return;
    }

    this.state.bandTaken = true;
    this.transitionTo("BAND_TAKEN");
    this.ui.logNarrative("You take the band, and place it around your wrist. Its screen flickers on...");
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

  private resetRuntimeCounters(): void {
    this.stokeCooldownUntilMs = 0;
    this.freezeAccumulatorMs = 0;
    this.heatDecayAccumulatorMs = 0;
    this.healthRegenAccumulatorMs = 0;
    this.timeAccumulatorMs = 0;
    this.freezeWarningAccumulatorMs = 0;
    this.ambientAccumulatorMs = 0;
    this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
  }

  private tick(): void {
    const now = Date.now();
    const delta = now - this.lastTickMs;
    this.lastTickMs = now;

    if (!this.state.started || this.state.stage === "DEMO_END") {
      return;
    }

    this.applyTimeProgress(delta);
    this.applyHeatAndHealth(delta);
    this.applyAmbientLogs(delta);

    if (this.state.health <= 0) {
      this.ui.logSystem("Vital signs flatline");
      this.ui.logNarrative("You freeze before the station wakes.");
      this.restartRun();
      return;
    }

    this.render();
  }

  private applyTimeProgress(deltaMs: number): void {
    this.timeAccumulatorMs += deltaMs;

    while (this.timeAccumulatorMs >= 1000) {
      this.timeAccumulatorMs -= 1000;
      this.state.timeMinutes += TIME_ADVANCE_MINUTES_PER_SECOND;
      if (this.state.timeMinutes >= 24 * 60) {
        this.state.timeMinutes -= 24 * 60;
      }
    }
  }

  private applyHeatAndHealth(deltaMs: number): void {
    this.freezeWarningAccumulatorMs += deltaMs;

    this.heatDecayAccumulatorMs += deltaMs;
    while (this.heatDecayAccumulatorMs >= 1000) {
      this.heatDecayAccumulatorMs -= 1000;
      if (this.state.heat > 0) {
        this.state.heat = Math.max(0, this.state.heat - HEAT_DECAY_PER_SECOND);
      }
    }

    if (this.state.heat === 0) {
      this.healthRegenAccumulatorMs = 0;
      this.freezeAccumulatorMs += deltaMs;

      if (this.freezeWarningAccumulatorMs >= 5000) {
        this.freezeWarningAccumulatorMs = 0;
        this.ui.logNarrative(this.pickOne(FREEZE_WARNING_LINES));
      }

      while (this.freezeAccumulatorMs >= HEALTH_DRAIN_SECONDS * 1000) {
        this.freezeAccumulatorMs -= HEALTH_DRAIN_SECONDS * 1000;
        this.state.health = Math.max(0, this.state.health - 1);
      }
    } else {
      this.freezeAccumulatorMs = 0;
      this.freezeWarningAccumulatorMs = 0;
      this.healthRegenAccumulatorMs += deltaMs;

      while (this.healthRegenAccumulatorMs >= HEALTH_REGEN_SECONDS * 1000) {
        this.healthRegenAccumulatorMs -= HEALTH_REGEN_SECONDS * 1000;
        this.state.health = Math.min(this.state.maxHealth, this.state.health + 1);
      }
    }

    if (!this.state.lookUnlocked && this.state.heat >= LOOK_UNLOCK_HEAT && this.state.health > LOOK_UNLOCK_HEALTH) {
      this.state.lookUnlocked = true;
      this.transitionTo("LOOK_UNLOCKED");
      this.ui.logNarrative("Your eyes adjust to the faint light from the reactor.");
    }
  }

  private applyAmbientLogs(deltaMs: number): void {
    this.ambientAccumulatorMs += deltaMs;
    if (this.ambientAccumulatorMs < this.nextAmbientAtMs) {
      return;
    }

    this.ambientAccumulatorMs = 0;
    this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
    if (Math.random() <= AMBIENT_TRIGGER_CHANCE) {
      this.ui.logNarrative(this.pickOne(AMBIENT_LINES));
    }
  }

  private render(): void {
    this.ui.setRoomTitle(this.state.currentLocationLabel);
    this.ui.setActions(this.getActionButtons());
    this.ui.setVitals(this.state.bandTaken, this.formatVitals());
    this.ui.setMap(false, "");
    this.ui.setNavigation(this.getNavigationState());
    this.ui.setDemoVisible(this.state.demoComplete);
  }

  private getActionButtons(): ActionButtonState[] {
    const stokeRemaining = this.getStokeCooldownRemainingMs();
    const buttons: ActionButtonState[] = [
      {
        command: "stoke",
        label: stokeRemaining > 0 ? `STOKE EMBERS ${(stokeRemaining / 1000).toFixed(1)}s` : "STOKE EMBERS",
        disabled: stokeRemaining > 0,
        cooldownFill: stokeRemaining / STOKE_COOLDOWN_MS
      }
    ];

    if (this.state.lookUnlocked && this.state.heat !== 0) {
      buttons.push({ command: "look around", label: "LOOK AROUND" });
    }

    if (this.state.revealStep >= 2 && !this.state.bandTaken) {
      buttons.push({ command: "take band", label: "TAKE THE BAND" });
    }

    return buttons;
  }

  private getNavigationState(): NavigationState {
    return {
      visible: this.state.navUnlocked,
      currentLabel: "A DARK ROOM",
      targetLabel: "DARKNESS THROUGH THE DOORWAY",
      canEnter: this.state.navUnlocked && this.state.stage !== "DEMO_END"
    };
  }

  private formatVitals(): string {
    return [
      `Health: ${this.state.health}/${this.state.maxHealth}`,
      `Heat: ${this.state.heat}/${this.state.heatCap}`,
      `Time: ${this.formatTime(this.state.timeMinutes)}`
    ].join("\n");
  }

  private formatMap(): string {
    if (this.state.revealStep === 0) {
      return "";
    }

    if (this.state.revealStep < 3) {
      return [
        "+----------------------+",
        "|        (you)         |",
        "|     A DARK SPACE     |",
        "+----------------------+"
      ].join("\n");
    }

    return [
      "+-----------------------------------+",
      "| [A DARK ROOM] ---- [DOORWAY]      |",
      "|      YOU               ENTER      |",
      "+-----------------------------------+"
    ].join("\n");
  }

  private formatTime(totalMinutes: number): string {
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const isPm = hours24 >= 12;
    const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
  }

  private getStokeCooldownRemainingMs(): number {
    return Math.max(0, this.stokeCooldownUntilMs - Date.now());
  }

  private pickOne(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
