import { DataBundle, EventDef, RecipeDef, RoomDef } from "./types.js";

async function readJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

export async function loadData(): Promise<DataBundle> {
  const rooms = await readJson<RoomDef[]>("/data/rooms.json");
  const events = await readJson<EventDef[]>("/data/events.json");
  const recipes = await readJson<RecipeDef[]>("/data/recipes.json");

  return { rooms, events, recipes };
}
