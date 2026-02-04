const BOOT_DELAY_MS = 190;
const LOG_TYPING_SPEED_MS = 9;
const MAX_LOG_LINES = 20;
export class UI {
    constructor(onWake, onAction, onEnter, onRestart) {
        this.onWake = onWake;
        this.onAction = onAction;
        this.onEnter = onEnter;
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
        const wakeButtonEl = document.getElementById("wake-button");
        const bootScreenEl = document.getElementById("boot-screen");
        const bootLinesEl = document.getElementById("boot-lines");
        const bootProgressEl = document.getElementById("boot-progress");
        const demoModalEl = document.getElementById("demo-modal");
        const restartButtonEl = document.getElementById("restart-button");
        if (!roomTitleEl ||
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
            !demoModalEl ||
            !restartButtonEl) {
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
        this.demoModalEl = demoModalEl;
        this.restartButtonEl = restartButtonEl;
        this.wakeButtonEl.addEventListener("click", () => this.onWake());
        this.restartButtonEl.addEventListener("click", () => this.onRestart());
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
    setRoomTitle(title) {
        this.roomTitleEl.textContent = title;
    }
    setActions(actions) {
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
    setVitals(visible, text) {
        this.vitalsPanelEl.classList.toggle("is-hidden", !visible);
        this.vitalsEl.textContent = text;
    }
    setMap(visible, text) {
        this.mapPanelEl.classList.toggle("is-hidden", !visible);
        this.mapEl.textContent = text;
    }
    setNavigation(state) {
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
            if (!queued)
                continue;
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
                if (!last)
                    break;
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
}
