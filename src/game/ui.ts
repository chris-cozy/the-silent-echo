export interface ActionButtonState {
  command: string;
  label?: string;
  disabled?: boolean;
  cooldownFill?: number;
}

export interface NavigationState {
  visible: boolean;
  currentLabel: string;
  targetLabel: string;
  canEnter: boolean;
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
  private demoModalEl: HTMLElement;
  private deathModalEl: HTMLElement;
  private deathMessageEl: HTMLElement;
  private deathButtonEl: HTMLButtonElement;
  private restartButtonEl: HTMLButtonElement;
  private onWake: () => void;
  private onAction: (command: string) => void;
  private onEnter: () => void;
  private onDeathAcknowledge: () => void;
  private onRestart: () => void;
  private logQueue: QueuedLog[];
  private logTyping: boolean;

  constructor(
    onWake: () => void,
    onAction: (command: string) => void,
    onEnter: () => void,
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

  setRoomTitle(title: string): void {
    this.roomTitleEl.textContent = title;
  }

  setActions(actions: ActionButtonState[]): void {
    this.actionsEl.innerHTML = "";
    this.actionsEl.classList.toggle("panel__body--actions-centered", actions.length === 1 && actions[0]?.command === "stoke");

    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-button";
      if (action.command === "stoke") {
        button.classList.add("action-button--stoke");
      }
      button.disabled = Boolean(action.disabled);
      button.style.setProperty("--cooldown-fill", `${Math.max(0, Math.min(1, action.cooldownFill ?? 0))}`);

      const label = document.createElement("span");
      label.textContent = action.label ?? action.command;
      button.appendChild(label);

      // Use pointerdown so actions register immediately even while UI is re-rendering.
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onAction(action.command);
      });
      this.actionsEl.appendChild(button);
    }
  }

  setVitals(visible: boolean, text: string): void {
    this.vitalsPanelEl.classList.toggle("is-hidden", !visible);
    this.vitalsEl.textContent = text;
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

    const currentRow = document.createElement("div");
    currentRow.className = "nav-row";

    const currentLabel = document.createElement("div");
    currentLabel.className = "nav-row__label";
    currentLabel.textContent = state.currentLabel;

    const currentBadge = document.createElement("div");
    currentBadge.className = "nav-row__current";
    currentBadge.textContent = "Current Location";

    currentRow.appendChild(currentLabel);
    currentRow.appendChild(currentBadge);
    this.navEl.appendChild(currentRow);

    const targetRow = document.createElement("div");
    targetRow.className = "nav-row";

    const targetLabel = document.createElement("div");
    targetLabel.className = "nav-row__label";
    targetLabel.textContent = state.targetLabel;

    const enterButton = document.createElement("button");
    enterButton.type = "button";
    enterButton.className = "nav-button";
    enterButton.disabled = !state.canEnter;

    const enterText = document.createElement("span");
    enterText.textContent = "ENTER";
    enterButton.appendChild(enterText);
    enterButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.onEnter();
    });

    targetRow.appendChild(targetLabel);
    targetRow.appendChild(enterButton);
    this.navEl.appendChild(targetRow);
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
}
