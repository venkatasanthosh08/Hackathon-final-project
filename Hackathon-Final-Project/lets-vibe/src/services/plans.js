// Subscription plans (demo flow - no real payment is taken).
import { PLANS, DEFAULT_PLAN, SUBSCRIPTION_DAYS, KEYS } from "../config.js";
import { read, write } from "./storage.js";

const DAY = 86400000;

export const getPlanRecord = (email) => read(KEYS.plans, {})[email] || null;

// Effective plan id: falls back to Basic when the demo subscription has expired.
export const getPlanId = (email) => {
  const rec = getPlanRecord(email);
  if (!rec || !PLANS[rec.planId]) return DEFAULT_PLAN;
  if (rec.expiresAt && rec.expiresAt <= Date.now()) return DEFAULT_PLAN;
  return rec.planId;
};
export const getPlan = (email) => PLANS[getPlanId(email)];
export const canCreateRoom = (email) => !!getPlan(email).canCreateRoom;

export const selectPlan = (email, planId) => {
  if (!PLANS[planId]) return "Unknown plan.";
  const all = read(KEYS.plans, {});
  const now = Date.now();
  all[email] = {
    planId,
    startedAt: now,
    expiresAt: planId === DEFAULT_PLAN || !SUBSCRIPTION_DAYS ? null : now + SUBSCRIPTION_DAYS * DAY,
  };
  write(KEYS.plans, all);
  return null;
};

// Demo helper so the "premium expired" rule can be shown live.
export const expirePlanNow = (email) => {
  const all = read(KEYS.plans, {});
  if (all[email]) {
    all[email] = { ...all[email], expiresAt: Date.now() - 1 };
    write(KEYS.plans, all);
  }
};
