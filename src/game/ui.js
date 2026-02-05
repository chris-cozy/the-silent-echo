const BOOT_DELAY_MS = 190;
const LOG_TYPING_SPEED_MS = 9;
const MAX_LOG_LINES = 20;
export class UI {
  constructor(onWake, onAction, onEnter, onDeathAcknowledge, onRestart) {
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
        this.systemsTab = "vitals";
        this.operationsTab = "nav";
        this.systemsAvailability = { vitals: false, storage: false };
        this.operationsAvailability = { ai: false, map: false, nav: false };
        this.lastSystemsAvailability = { vitals: false, storage: false };
        this.lastOperationsAvailability = { ai: false, map: false, nav: false };

    const roomTitleEl = document.getElementById("room-title");
    const actionsEl = document.getElementById("actions");
    const logEl = document.getElementById("log");
    const systemsPanelEl = document.getElementById("systems-panel");
    const systemsVitalsEl = document.getElementById("systems-vitals");
    const systemsStorageEl = document.getElementById("systems-storage");
    const systemsTabVitalsEl = document.getElementById("systems-tab-vitals");
    const systemsTabStorageEl = document.getElementById("systems-tab-storage");
    const operationsPanelEl = document.getElementById("operations-panel");
    const operationsAiEl = document.getElementById("operations-ai");
    const operationsMapEl = document.getElementById("operations-map");
    const operationsNavEl = document.getElementById("operations-nav");
    const operationsTabAiEl = document.getElementById("operations-tab-ai");
    const operationsTabMapEl = document.getElementById("operations-tab-map");
    const operationsTabNavEl = document.getElementById("operations-tab-nav");
    const aiPanelEl = document.getElementById("operations-ai");
    const aiStatusEl = document.getElementById("ai-status");
    const aiReasonEl = document.getElementById("ai-reason");
    const mapEl = document.getElementById("map");
    const navEl = document.getElementById("nav");
    const wakeScreenEl = document.getElementById("wake-screen");
    const wakeButtonEl = document.getElementById("wake-button");
    const bootScreenEl = document.getElementById("boot-screen");
    const bootLinesEl = document.getElementById("boot-lines");
    const bootProgressEl = document.getElementById("boot-progress");
    const echoIdEl = document.getElementById("echo-id");
    const playerNameEl = document.getElementById("player-name");
    const demoModalEl = document.getElementById("demo-modal");
    const deathModalEl = document.getElementById("death-modal");
    const deathMessageEl = document.getElementById("death-message");
    const deathButtonEl = document.getElementById("death-button");
    const restartButtonEl = document.getElementById("restart-button");

    if (
      !roomTitleEl ||
      !actionsEl ||
      !logEl ||
      !systemsPanelEl ||
      !systemsVitalsEl ||
      !systemsStorageEl ||
      !systemsTabVitalsEl ||
      !systemsTabStorageEl ||
      !operationsPanelEl ||
      !operationsAiEl ||
      !operationsMapEl ||
      !operationsNavEl ||
      !operationsTabAiEl ||
      !operationsTabMapEl ||
      !operationsTabNavEl ||
      !aiPanelEl ||
      !aiStatusEl ||
      !aiReasonEl ||
      !mapEl ||
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
    this.systemsPanelEl = systemsPanelEl;
    this.systemsVitalsEl = systemsVitalsEl;
    this.systemsStorageEl = systemsStorageEl;
    this.systemsTabVitalsEl = systemsTabVitalsEl;
    this.systemsTabStorageEl = systemsTabStorageEl;
    this.operationsPanelEl = operationsPanelEl;
    this.operationsAiEl = operationsAiEl;
    this.operationsMapEl = operationsMapEl;
    this.operationsNavEl = operationsNavEl;
    this.operationsTabAiEl = operationsTabAiEl;
    this.operationsTabMapEl = operationsTabMapEl;
    this.operationsTabNavEl = operationsTabNavEl;
    this.aiPanelEl = aiPanelEl;
    this.aiStatusEl = aiStatusEl;
    this.aiReasonEl = aiReasonEl;
    this.mapEl = mapEl;
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

    this.systemsTabVitalsEl.addEventListener("click", () => this.setSystemsTab("vitals"));
    this.systemsTabStorageEl.addEventListener("click", () => this.setSystemsTab("storage"));
    this.operationsTabAiEl.addEventListener("click", () => this.setOperationsTab("ai"));
    this.operationsTabMapEl.addEventListener("click", () => this.setOperationsTab("map"));
    this.operationsTabNavEl.addEventListener("click", () => this.setOperationsTab("nav"));
  }

  clearLogs() {
    this.logQueue = [];
    this.logEl.innerHTML = "";
  }

  setWakeVisible(visible) {
    this.wakeScreenEl.classList.toggle("is-hidden", !visible);
  }

  setDemoVisible(visible) {
    this.demoModalEl.classList.toggle("is-hidden", !visible);
  }

  setDeathVisible(visible) {
    this.deathModalEl.classList.toggle("is-hidden", !visible);
  }

  setDeathMessage(text) {
    this.deathMessageEl.textContent = text;
  }

  setEchoId(echoId) {
    this.echoIdEl.textContent = `Echo-${echoId.toString().padStart(2, "0")}`;
  }

  setPlayerName(name) {
    this.playerNameEl.textContent = name;
  }

  setRoomTitle(title) {
    this.roomTitleEl.textContent = title;
  }

  setActions(actions) {
    this.actionsEl.classList.toggle(
      "panel__body--actions-centered",
      actions.length === 1 && actions[0]?.command === "stoke"
    );

    const seen = new Set();

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

  setVitals(visible, vitals) {
    this.systemsAvailability.vitals = visible;
    if (!visible || !vitals) {
      this.systemsVitalsEl.innerHTML = "";
      this.updateSystemsPanel();
      return;
    }

    const healthRatio = Math.max(0, Math.min(1, vitals.health / vitals.healthMax));
    const heatRatio = Math.max(0, Math.min(1, vitals.heat / vitals.heatMax));

    this.systemsVitalsEl.innerHTML = `
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
    this.updateSystemsPanel();
  }

  setStorage(storage) {
    this.systemsAvailability.storage = storage.visible;
    if (!storage.visible) {
      this.systemsStorageEl.innerHTML = "";
      this.updateSystemsPanel();
      return;
    }

    const items = storage.items.length > 0 ? storage.items : ["None"];
    const resources = storage.resources.map((entry) => `${entry.id}: ${entry.count}`);

    const resourcesSection = storage.showResources
      ? `
      <div class="storage-section">
        <div class="storage-section__title">Resources</div>
        <div class="storage-section__body">
          ${resources.map((item) => `<div class="storage-item">${item}</div>`).join("")}
        </div>
      </div>
    `
      : "";

    this.systemsStorageEl.innerHTML = `
      <div class="storage-section">
        <div class="storage-section__title">Items</div>
        <div class="storage-section__body">
          ${items.map((item) => `<div class="storage-item">${item}</div>`).join("")}
        </div>
      </div>
      ${resourcesSection}
    `;
    this.updateSystemsPanel();
  }

  setAiPanel(ai) {
    this.operationsAvailability.ai = ai.visible;
    this.aiPanelEl.classList.toggle("is-hidden", !ai.visible);
    if (!ai.visible) {
      this.updateOperationsPanel();
      return;
    }

    this.aiStatusEl.textContent = ai.status;
    this.aiReasonEl.textContent = ai.reason;
    this.updateOperationsPanel();
  }

  setMap(visible, text) {
    this.operationsAvailability.map = visible;
    this.operationsMapEl.classList.toggle("is-hidden", !visible);
    if (visible) {
      this.mapEl.textContent = text;
    } else {
      this.mapEl.textContent = "";
    }
    this.updateOperationsPanel();
  }

  setNavigation(state) {
    this.operationsAvailability.nav = state.visible;
    this.operationsNavEl.classList.toggle("is-hidden", !state.visible);
    if (!state.visible) {
      this.navEl.innerHTML = "";
      this.updateOperationsPanel();
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
    this.updateOperationsPanel();
  }

  logSystem(message) {
    this.enqueueLog(message, "system");
  }

  logNarrative(message) {
    this.enqueueLog(message, "narrative");
  }

  async playBootSequence(lines) {
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

  enqueueLog(text, kind) {
    this.logQueue.push({ text, kind });
    if (!this.logTyping) {
      void this.flushLogQueue();
    }
  }

  async flushLogQueue() {
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

  async typeLine(target, content) {
    const delay = this.logQueue.length > 4 ? 1 : LOG_TYPING_SPEED_MS;
    for (let index = 0; index < content.length; index += 1) {
      target.textContent = content.slice(0, index + 1);
      await this.sleep(delay);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  startCooldownLoop() {
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

  setSystemsTab(tab) {
    if (!this.systemsAvailability[tab]) {
      return;
    }
    this.systemsTab = tab;
    this.updateSystemsPanel();
  }

  setOperationsTab(tab) {
    if (!this.operationsAvailability[tab]) {
      return;
    }
    this.operationsTab = tab;
    this.updateOperationsPanel();
  }

  updateSystemsPanel() {
    const { vitals, storage } = this.systemsAvailability;
    const newlyUnlockedVitals = vitals && !this.lastSystemsAvailability.vitals;
    const newlyUnlockedStorage = storage && !this.lastSystemsAvailability.storage;
    const anyVisible = vitals || storage;
    this.systemsPanelEl.classList.toggle("is-hidden", !anyVisible);
    if (!anyVisible) {
      this.lastSystemsAvailability = { ...this.systemsAvailability };
      return;
    }

    if (newlyUnlockedStorage) {
      this.systemsTab = "storage";
    } else if (newlyUnlockedVitals) {
      this.systemsTab = "vitals";
    }

    if (!this.systemsAvailability[this.systemsTab]) {
      this.systemsTab = vitals ? "vitals" : "storage";
    }

    this.systemsTabVitalsEl.classList.toggle("is-hidden", !vitals);
    this.systemsTabStorageEl.classList.toggle("is-hidden", !storage);

    this.systemsTabVitalsEl.classList.toggle("is-active", this.systemsTab === "vitals");
    this.systemsTabStorageEl.classList.toggle("is-active", this.systemsTab === "storage");

    this.systemsVitalsEl.classList.toggle("is-hidden", this.systemsTab !== "vitals");
    this.systemsStorageEl.classList.toggle("is-hidden", this.systemsTab !== "storage");
    this.lastSystemsAvailability = { ...this.systemsAvailability };
  }

  updateOperationsPanel() {
    const { ai, map, nav } = this.operationsAvailability;
    const newlyUnlockedAi = ai && !this.lastOperationsAvailability.ai;
    const newlyUnlockedMap = map && !this.lastOperationsAvailability.map;
    const newlyUnlockedNav = nav && !this.lastOperationsAvailability.nav;
    const anyVisible = ai || map || nav;
    this.operationsPanelEl.classList.toggle("is-hidden", !anyVisible);
    if (!anyVisible) {
      this.lastOperationsAvailability = { ...this.operationsAvailability };
      return;
    }

    if (newlyUnlockedAi) {
      this.operationsTab = "ai";
    } else if (newlyUnlockedMap) {
      this.operationsTab = "map";
    } else if (newlyUnlockedNav) {
      this.operationsTab = "nav";
    }

    if (!this.operationsAvailability[this.operationsTab]) {
      if (ai) {
        this.operationsTab = "ai";
      } else if (map) {
        this.operationsTab = "map";
      } else {
        this.operationsTab = "nav";
      }
    }

    this.operationsTabAiEl.classList.toggle("is-hidden", !ai);
    this.operationsTabMapEl.classList.toggle("is-hidden", !map);
    this.operationsTabNavEl.classList.toggle("is-hidden", !nav);

    this.operationsTabAiEl.classList.toggle("is-active", this.operationsTab === "ai");
    this.operationsTabMapEl.classList.toggle("is-active", this.operationsTab === "map");
    this.operationsTabNavEl.classList.toggle("is-active", this.operationsTab === "nav");

    this.operationsAiEl.classList.toggle("is-hidden", this.operationsTab !== "ai");
    this.operationsMapEl.classList.toggle("is-hidden", this.operationsTab !== "map");
    this.operationsNavEl.classList.toggle("is-hidden", this.operationsTab !== "nav");
    this.lastOperationsAvailability = { ...this.operationsAvailability };
  }
}
