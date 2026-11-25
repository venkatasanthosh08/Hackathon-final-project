// Central, easy-to-edit configuration for Let's Vibe (prototype / hackathon demo).
// Change limits here and the whole app follows.

export const PLANS = {
  basic: {
    id: "basic",
    name: "Basic",
    price: "Demo",
    maxDevices: 2,
    canCreateRoom: false,
    features: ["Stream on up to 2 devices at the same time", "Normal streaming access"],
  },
  standard: {
    id: "standard",
    name: "Standard",
    price: "Demo",
    maxDevices: 4,
    canCreateRoom: false,
    features: ["Stream on up to 4 devices at the same time", "All Basic benefits"],
  },
  premium: {
    id: "premium",
    name: "Vibe Premium",
    price: "Demo",
    maxDevices: 4, // Premium includes Standard benefits
    canCreateRoom: true,
    maxGuests: 3,
    features: [
      "All Standard benefits",
      "Create Vibe Together group-watch rooms",
      "Invite up to 3 guests per room",
    ],
  },
};

export const PLAN_ORDER = ["basic", "standard", "premium"];
export const DEFAULT_PLAN = "basic";
// Demo subscriptions last this long. Set to null for "never expires".
export const SUBSCRIPTION_DAYS = 30;

export const ROOM = {
  maxParticipants: 4, // including the host
  codeLength: 6,
  heartbeatMs: 4000,
  guestStaleMs: 20000, // guest silent this long -> seat is freed
  hostStaleMs: 45000, // host silent this long -> room is closed
  fullMessage: "Sorry! This Vibe Together room is full.",
};

// Local Storage keys used by features (users and watchlists are local; login session is per-tab sessionStorage).
export const KEYS = {
  plans: "plans", // { [email]: { planId, startedAt, expiresAt } }
  rooms: "vibeRooms", // [room, ...] (closed rooms are kept for analytics)
  streams: "activeStreams", // [{ deviceId, email, contentId, lastSeen }]
  watchLog: "watchLog", // [{ contentId, genre, source, ts, demo? }]  (no user identity stored)
  submissions: "creatorSubmissions",
};

export const STREAM_STALE_MS = 15000;
