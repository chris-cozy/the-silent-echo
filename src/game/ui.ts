export interface ActionButtonState {
  command: string;
  label?: string;
  disabled?: boolean;
  cooldownEndsAtMs?: number;
  cooldownDurationMs?: number;
}

export interface NavigationEntryState {
  id: string;
  label: string;
  isCurrent: boolean;
  canEnter: boolean;
}

export interface NavigationState {
  visible: boolean;
  entries: NavigationEntryState[];
}

type LogKind = "system" | "narrative";

interface QueuedLog {
  text: string;
  kind: LogKind;
}

const BOOT_DELAY_MS = 190;
const LOG_TYPING_SPEED_MS = 9;
const MAX_LOG_LINES = 20;

export class UI {
  private roomTitleEl: HTMLElement;
  private actionsEl: HTMLElement;
  private logEl: HTMLElement;
  private vitalsPanelEl: HTMLElement;
  private vitalsEl: HTMLElement;
  private mapPanelEl: HTMLElement;
  private mapEl: HTMLElement;
  private navPanelEl: HTMLElement;
  private navEl: HTMLElement;
  private wakeScreenEl: HTMLElement;
  private wakeButtonEl: HTMLButtonElement;
  private bootScreenEl: HTMLElement;
  private bootLinesEl: HTMLElement;
  private bootProgressEl: HTMLElement;
  private echoIdEl: HTMLElement;
  private playerNameEl: HTMLElement;
  private demoModalEl: HTMLElement;
  private deathModalEl: HTMLElement;
  private deathMessageEl: HTMLElement;
  private deathButtonEl: HTMLButtonElement;
  private restartButtonEl: HTMLButtonElement;
  private onWake: () => void;
  private onAction: (command: string) => void;
  private onEnter: (targetId: string) => void;
  private onDeathAcknowledge: () => void;
  private onRestart: () => void;
  private logQueue: QueuedLog[];
  private logTyping: boolean;
  private actionButtons: Map<string, HTMLButtonElement>;
  private cooldownItems: Map<string, { button: HTMLButtonElement; endsAt: number; duration: number }>;
  private cooldownRaf: number | null;

  constructor(
    onWake: () => void,
    onAction: (command: string) => void,
    onEnter: (targetId: string) => void,
    onDeathAcknowledge: () => void,
    onRestart: () => void
  ) {
    this.onWake = onWake;
    this.onAction = onAction;
    this.onEnter = onEnter;
    this.onDeathAcknowledge = onDeathAcknowledge;
    this.onRestart = onRestart;
    this.logQueue = [];
    this.logTyping = false;
    this.actionButtons = new Map();
    this.cooldownItems = new Map();
    this.cooldownRaf = null;

    const roomTitleEl = document.getElementById("room-title");
    const actionsEl = document.getElementById("actions");
    const logEl = document.getElementById("log");
    const vitalsPanelEl = document.getElementById("vitals-panel");
    const vitalsEl = document.getElementById("vitals");
    const mapPanelEl = document.getElementById("map-panel");
    const mapEl = document.getElementById("map");
    const navPanelEl = document.getElementById("nav-panel");
    const navEl = document.getElementById("nav");
    const wakeScreenEl = document.getElementById("wake-screen");
    const wakeButtonEl = document.getElementById("wake-button") as HTMLButtonElement | null;
    const bootScreenEl = document.getElementById("boot-screen");
    const bootLinesEl = document.getElementById("boot-lines");
    const bootProgressEl = document.getElementById("boot-progress");
    const echoIdEl = document.getElementById("echo-id");
    const playerNameEl = document.getElementById("player-name");
    const demoModalEl = document.getElementById("demo-modal");
    const deathModalEl = document.getElementById("death-modal");
    const deathMessageEl = document.getElementById("death-message");
    const deathButtonEl = document.getElementById("death-button") as HTMLButtonElement | null;
    const restartButtonEl = document.getElementById("restart-button") as HTMLButtonElement | null;

    if (
      !roomTitleEl ||
      !actionsEl ||
      !logEl ||
      !vitalsPanelEl ||
      !vitalsEl ||
      !mapPanelEl ||
      !mapEl ||
      !navPanelEl ||
      !navEl ||
      !wakeScreenEl ||
      !wakeButtonEl ||
      !bootScreenEl ||
      !bootLinesEl ||
      !bootProgressEl ||
      !echoIdEl ||
      !playerNameEl ||
      !demoModalEl ||
      !deathModalEl ||
      !deathMessageEl ||
      !deathButtonEl ||
      !restartButtonEl
    ) {
      throw new Error("UI elements missing");
    }

    this.roomTitleEl = roomTitleEl;
    this.actionsEl = actionsEl;
    this.logEl = logEl;
    this.vitalsPanelEl = vitalsPanelEl;
    this.vitalsEl = vitalsEl;
    this.mapPanelEl = mapPanelEl;
    this.mapEl = mapEl;
    this.navPanelEl = navPanelEl;
    this.navEl = navEl;
    this.wakeScreenEl = wakeScreenEl;
    this.wakeButtonEl = wakeButtonEl;
    this.bootScreenEl = bootScreenEl;
    this.bootLinesEl = bootLinesEl;
    this.bootProgressEl = bootProgressEl;
    this.echoIdEl = echoIdEl;
    this.playerNameEl = playerNameEl;
    this.demoModalEl = demoModalEl;
    this.deathModalEl = deathModalEl;
    this.deathMessageEl = deathMessageEl;
    this.deathButtonEl = deathButtonEl;
    this.restartButtonEl = restartButtonEl;

    this.wakeButtonEl.addEventListener("click", () => this.onWake());
    this.deathButtonEl.addEventListener("click", () => this.onDeathAcknowledge());
    this.restartButtonEl.addEventListener("click", () => this.onRestart());
  }

  clearLogs(): void {
    this.logQueue = [];
    this.logEl.innerHTML = "";
  }

  setWakeVisible(visible: boolean): void {
    this.wakeScreenEl.classList.toggle("is-hidden", !visible);
  }

  setDemoVisible(visible: boolean): void {
    this.demoModalEl.classList.toggle("is-hidden", !visible);
  }

  setDeathVisible(visible: boolean): void {
    this.deathModalEl.classList.toggle("is-hidden", !visible);
  }

  setDeathMessage(text: string): void {
    this.deathMessageEl.textContent = text;
  }

  setEchoId(echoId: number): void {
    this.echoIdEl.textContent = `Echo-${echoId.toString().padStart(2, "0")}`;
  }

  setPlayerName(name: string): void {
    this.playerNameEl.textContent = name;
  }

  setRoomTitle(title: string): void {
    this.roomTitleEl.textContent = title;
  }

  setActions(actions: ActionButtonState[]): void {
    this.actionsEl.classList.toggle("panel__body--actions-centered", actions.length === 1 && actions[0]?.command === "stoke");

    const seen = new Set<string>();

    for (const action of actions) {
      seen.add(action.command);
      let button = this.actionButtons.get(action.command);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "action-button";
        if (action.command === "stoke") {
          button.classList.add("action-button--stoke");
        }

        const label = document.createElement("span");
        button.appendChild(label);

        // Use pointerdown so actions register immediately even while UI is re-rendering.
        button.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          this.onAction(action.command);
        });

        this.actionButtons.set(action.command, button);
      }

      const label = button.querySelector("span");
      if (label) {
        label.textContent = action.label ?? action.command;
      }

      button.disabled = Boolean(action.disabled);

      if (action.cooldownEndsAtMs && action.cooldownDurationMs) {
        const now = Date.now();
        const remaining = action.cooldownEndsAtMs - now;
        const ratio = remaining > 0 ? remaining / action.cooldownDurationMs : 0;
        button.style.setProperty("--cooldown-fill", `${Math.max(0, Math.min(1, ratio))}`);
        this.cooldownItems.set(action.command, {
          button,
          endsAt: action.cooldownEndsAtMs,
          duration: action.cooldownDurationMs
        });
        this.startCooldownLoop();
      } else {
        this.cooldownItems.delete(action.command);
        button.style.setProperty("--cooldown-fill", "0");
      }

      this.actionsEl.appendChild(button);
    }

    for (const [command, button] of Array.from(this.actionButtons.entries())) {
      if (!seen.has(command)) {
        button.remove();
        this.actionButtons.delete(command);
        this.cooldownItems.delete(command);
      }
    }
  }

  setVitals(
    visible: boolean,
    vitals: { health: number; healthMax: number; heat: number; heatMax: number; time: string } | null
  ): void {
    this.vitalsPanelEl.classList.toggle("is-hidden", !visible);
    if (!visible || !vitals) {
      this.vitalsEl.innerHTML = "";
      return;
    }

    const healthRatio = Math.max(0, Math.min(1, vitals.health / vitals.healthMax));
    const heatRatio = Math.max(0, Math.min(1, vitals.heat / vitals.heatMax));

    this.vitalsEl.innerHTML = `
      <div class="vitals-band">
        <div class="vitals-band__time">${vitals.time}</div>
        <div class="vitals-band__meters">
          <div class="vitals-meter">
            <div class="vitals-meter__label">Health</div>
            <div class="vitals-meter__bar">
              <span style="width: ${(healthRatio * 100).toFixed(1)}%"></span>
            </div>
            <div class="vitals-meter__value">${vitals.health}/${vitals.healthMax}</div>
          </div>
          <div class="vitals-meter">
            <div class="vitals-meter__label">Heat</div>
            <div class="vitals-meter__bar vitals-meter__bar--heat">
              <span style="width: ${(heatRatio * 100).toFixed(1)}%"></span>
            </div>
            <div class="vitals-meter__value">${vitals.heat}/${vitals.heatMax}</div>
          </div>
        </div>
      </div>
    `;
  }

  setMap(visible: boolean, text: string): void {
    this.mapPanelEl.classList.toggle("is-hidden", !visible);
    this.mapEl.textContent = text;
  }

  setNavigation(state: NavigationState): void {
    this.navPanelEl.classList.toggle("is-hidden", !state.visible);
    if (!state.visible) {
      this.navEl.innerHTML = "";
      return;
    }

    this.navEl.innerHTML = "";
    for (const entry of state.entries) {
      const row = document.createElement("div");
      row.className = "nav-row";

      const label = document.createElement("div");
      label.className = "nav-row__label";
      label.textContent = entry.label;

      if (entry.isCurrent) {
        const currentBadge = document.createElement("div");
        currentBadge.className = "nav-row__current";
        currentBadge.textContent = "Current Location";
        row.appendChild(label);
        row.appendChild(currentBadge);
      } else {
        const enterButton = document.createElement("button");
        enterButton.type = "button";
        enterButton.className = "nav-button";
        enterButton.disabled = !entry.canEnter;

        const enterText = document.createElement("span");
        enterText.textContent = "ENTER";
        enterButton.appendChild(enterText);
        enterButton.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          this.onEnter(entry.id);
        });

        row.appendChild(label);
        row.appendChild(enterButton);
      }

      this.navEl.appendChild(row);
    }
  }

  logSystem(message: string): void {
    this.enqueueLog(message, "system");
  }

  logNarrative(message: string): void {
    this.enqueueLog(message, "narrative");
  }

  async playBootSequence(lines: string[]): Promise<void> {
    this.bootScreenEl.classList.remove("is-hidden");
    this.bootLinesEl.innerHTML = "";
    this.bootProgressEl.style.width = "0%";

    for (let index = 0; index < lines.length; index += 1) {
      const line = document.createElement("div");
      line.className = "boot-screen__line";
      line.textContent = lines[index];
      this.bootLinesEl.appendChild(line);

      const progress = Math.round(((index + 1) / lines.length) * 100);
      this.bootProgressEl.style.width = `${progress}%`;

      await this.sleep(BOOT_DELAY_MS);
    }

    await this.sleep(250);
    this.bootScreenEl.classList.add("is-hidden");
  }

  private enqueueLog(text: string, kind: LogKind): void {
    this.logQueue.push({ text, kind });
    if (!this.logTyping) {
      void this.flushLogQueue();
    }
  }

  private async flushLogQueue(): Promise<void> {
    this.logTyping = true;

    while (this.logQueue.length > 0) {
      const queued = this.logQueue.shift();
      if (!queued) continue;

      const entry = document.createElement("div");
      entry.className = `log-entry log-entry--${queued.kind}`;
      const text = document.createElement("div");
      text.className = "log-entry__text";
      entry.appendChild(text);

      this.logEl.insertBefore(entry, this.logEl.firstChild);
      const line = queued.kind === "system" ? `SYSTEM: ${queued.text}` : queued.text;
      await this.typeLine(text, line);

      entry.addEventListener("animationend", () => entry.remove());

      while (this.logEl.childElementCount > MAX_LOG_LINES) {
        const last = this.logEl.lastElementChild;
        if (!last) break;
        last.remove();
      }
    }

    this.logTyping = false;
  }

  private async typeLine(target: HTMLElement, content: string): Promise<void> {
    const delay = this.logQueue.length > 4 ? 1 : LOG_TYPING_SPEED_MS;
    for (let index = 0; index < content.length; index += 1) {
      target.textContent = content.slice(0, index + 1);
      await this.sleep(delay);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private startCooldownLoop(): void {
    if (this.cooldownRaf !== null) {
      return;
    }

    const step = () => {
      const now = Date.now();
      let hasActive = false;

      for (const [command, item] of this.cooldownItems.entries()) {
        const remaining = item.endsAt - now;
        const ratio = remaining > 0 ? remaining / item.duration : 0;
        item.button.style.setProperty("--cooldown-fill", `${Math.max(0, Math.min(1, ratio))}`);
        if (remaining <= 0) {
          item.button.disabled = false;
          this.cooldownItems.delete(command);
        } else {
          hasActive = true;
        }
      }

      if (hasActive) {
        this.cooldownRaf = window.requestAnimationFrame(step);
      } else {
        this.cooldownRaf = null;
      }
    };

    this.cooldownRaf = window.requestAnimationFrame(step);
  }
}
