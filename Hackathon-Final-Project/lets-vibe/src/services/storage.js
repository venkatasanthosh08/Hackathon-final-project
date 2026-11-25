// Tiny Local Storage + change-notification helper ("sync helper").
// NOTE: Local Storage is per-browser. Events reach other TABS of the same browser
// (via the native "storage" event) and the current tab (via a custom event).
// This is NOT cross-device synchronisation - that would need a real backend / WebSocket service.

const hasWindow = typeof window !== "undefined";
const LOCAL_EVENT = "lv:storage";

export const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  if (hasWindow) window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key } }));
};

// Call cb whenever `key` changes in this tab or another tab. Returns an unsubscribe function.
export const subscribe = (key, cb) => {
  if (!hasWindow) return () => {};
  const onLocal = (e) => e.detail.key === key && cb();
  const onNative = (e) => (e.key === key || e.key === null) && cb();
  window.addEventListener(LOCAL_EVENT, onLocal);
  window.addEventListener("storage", onNative);
  return () => {
    window.removeEventListener(LOCAL_EVENT, onLocal);
    window.removeEventListener("storage", onNative);
  };
};

export const makeId = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
