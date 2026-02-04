async function readJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }
    return (await response.json());
}
export async function loadData() {
    const rooms = await readJson("/data/rooms.json");
    const events = await readJson("/data/events.json");
    const recipes = await readJson("/data/recipes.json");
    return { rooms, events, recipes };
}
