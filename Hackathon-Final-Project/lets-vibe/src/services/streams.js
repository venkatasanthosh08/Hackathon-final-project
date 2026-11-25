// Simultaneous-device limits + anonymous watch log.
// A "device" = one browser tab (simulated). The same account in two tabs = two devices.
import { KEYS, STREAM_STALE_MS } from "../config.js";
import { read, write } from "./storage.js";
import { getDeviceId } from "./session.js";
import { getPlan } from "./plans.js";

const live = () => read(KEYS.streams, []).filter((s) => Date.now() - s.lastSeen < STREAM_STALE_MS);

// Try to start streaming on this device. Returns { ok, message }.
export const claimStream = (email, contentId) => {
  const deviceId = getDeviceId();
  const limit = getPlan(email).maxDevices;
  const all = live();
  const mine = all.filter((s) => s.email === email);
  const alreadyHere = mine.some((s) => s.deviceId === deviceId);
  if (!alreadyHere && mine.length >= limit) {
    return {
      ok: false,
      message: `Your ${getPlan(email).name} plan allows streaming on ${limit} devices at once. Stop another stream or upgrade your plan.`,
    };
  }
  write(KEYS.streams, [
    ...all.filter((s) => s.deviceId !== deviceId),
    { deviceId, email, contentId, lastSeen: Date.now() },
  ]);
  return { ok: true };
};

export const heartbeatStream = (email, contentId) => claimStream(email, contentId);

export const releaseStream = () => {
  const deviceId = getDeviceId();
  write(KEYS.streams, live().filter((s) => s.deviceId !== deviceId));
};

// Anonymous aggregate log: stores WHAT was watched, never WHO watched it.
export const logWatch = ({ contentId, genre, source = "movie" }) => {
  const log = read(KEYS.watchLog, []);
  log.push({ contentId, genre, source, ts: Date.now() });
  write(KEYS.watchLog, log.slice(-5000));
};
