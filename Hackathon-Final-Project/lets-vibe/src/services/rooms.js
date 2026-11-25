// Vibe Together rooms.
// SIMULATED: rooms live in this browser's Local Storage, so "real-time" sync works between
// tabs/windows of the same browser only. Different physical devices would need a backend
// (e.g. WebSocket / Firebase). All rules below are enforced in this service, not only in the UI.
import { ROOM, KEYS } from "../config.js";
import { read, write } from "./storage.js";
import { getPlan, getPlanId, canCreateRoom } from "./plans.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const makeCode = (existing) => {
  let code;
  do {
    code = Array.from({ length: ROOM.codeLength }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  } while (existing.some((r) => r.code === code));
  return code;
};

const load = () => read(KEYS.rooms, []);
const save = (rooms) => write(KEYS.rooms, rooms);
const clean = (c) => String(c || "").trim().toUpperCase();

const close = (room, reason) => ({ ...room, status: "closed", closedReason: reason, closedAt: Date.now() });

// Applies expiry/stale rules. Returns the same object when nothing changed.
const normalize = (room) => {
  if (room.status !== "open") return room;
  const now = Date.now();
  if (!canCreateRoom(room.hostEmail)) return close(room, "The host's Premium access ended.");
  const host = room.participants.find((p) => p.email === room.hostEmail);
  if (!host || now - host.lastSeen > ROOM.hostStaleMs) return close(room, "The host left.");
  const kept = room.participants.filter((p) => p.email === room.hostEmail || now - p.lastSeen <= ROOM.guestStaleMs);
  return kept.length === room.participants.length ? room : { ...room, participants: kept };
};

// Re-evaluate every room and persist only if something changed.
const refresh = () => {
  const rooms = load();
  const next = rooms.map(normalize);
  if (next.some((r, i) => r !== rooms[i])) save(next);
  return next;
};

const mutate = (code, fn) => {
  const rooms = refresh();
  const i = rooms.findIndex((r) => r.code === clean(code));
  if (i === -1) return { error: "Room not found. Check the code and try again." };
  const res = fn(rooms[i]);
  if (res.error) return res;
  rooms[i] = res.room;
  save(rooms);
  return { room: res.room };
};

const participant = (user) => ({
  email: user.email,
  name: user.name,
  plan: getPlanId(user.email),
  joinedAt: Date.now(),
  lastSeen: Date.now(),
});

export const getRoom = (code) => refresh().find((r) => r.code === clean(code)) || null;
export const getAllRooms = () => refresh();
export const findOpenRoomOf = (email) =>
  refresh().find((r) => r.status === "open" && r.participants.some((p) => p.email === email)) || null;

export function createRoom(user, movieId = 1) {
  if (!canCreateRoom(user.email)) return { error: "Only Vibe Premium subscribers can create a Vibe Together room." };
  const mine = findOpenRoomOf(user.email);
  if (mine) return { room: mine, existing: true };
  const rooms = refresh();
  const room = {
    code: makeCode(rooms),
    hostEmail: user.email,
    hostName: user.name,
    participants: [participant(user)],
    movieId,
    playback: { playing: false, time: 0, updatedAt: Date.now() },
    status: "open",
    createdAt: Date.now(),
  };
  save([...rooms, room]);
  return { room };
}

export function joinRoom(code, user) {
  const c = clean(code);
  if (!c) return { error: "Enter a room code." };
  const other = findOpenRoomOf(user.email);
  if (other && other.code !== c) return { error: `You are already in room ${other.code}. Leave it first.` };
  return mutate(c, (room) => {
    if (room.status !== "open") return { error: `This room is closed. ${room.closedReason || ""}`.trim() };
    // Same account on another tab/device = same participant (never counted twice)
    if (room.participants.some((p) => p.email === user.email)) {
      return { room: { ...room, participants: room.participants.map((p) => (p.email === user.email ? { ...p, lastSeen: Date.now() } : p)) } };
    }
    if (room.participants.length >= ROOM.maxParticipants) return { error: ROOM.fullMessage };
    return { room: { ...room, participants: [...room.participants, participant(user)] } };
  });
}

export function leaveRoom(code, email) {
  return mutate(code, (room) => {
    if (room.status !== "open") return { room };
    if (room.hostEmail === email) return { room: close(room, "The host left.") };
    return { room: { ...room, participants: room.participants.filter((p) => p.email !== email) } };
  });
}

export function heartbeat(code, email) {
  return mutate(code, (room) => {
    if (room.status !== "open") return { room };
    if (!room.participants.some((p) => p.email === email)) return { error: "You are no longer in this room." };
    return { room: { ...room, participants: room.participants.map((p) => (p.email === email ? { ...p, lastSeen: Date.now() } : p)) } };
  });
}

// ---- Host-only actions (enforced here, not just hidden in the UI) ----
const hostOnly = (code, email, fn) =>
  mutate(code, (room) => {
    if (room.status !== "open") return { error: "This room is closed." };
    if (room.hostEmail !== email) return { error: "Only the host can control playback." };
    return { room: fn(room) };
  });

export const setPlayback = (code, email, { playing, time }) =>
  hostOnly(code, email, (room) => ({ ...room, playback: { playing, time, updatedAt: Date.now() } }));

export const setRoomVideo = (code, email, movieId) =>
  hostOnly(code, email, (room) => ({ ...room, movieId, playback: { playing: false, time: 0, updatedAt: Date.now() } }));

export const roomSeats = (room) => `${room.participants.length}/${ROOM.maxParticipants}`;
export { getPlan };
