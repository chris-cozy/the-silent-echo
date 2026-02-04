const SAVE_KEY = "ase-save-slot1";
export function saveGame(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
export function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw)
        return null;
    return JSON.parse(raw);
}
