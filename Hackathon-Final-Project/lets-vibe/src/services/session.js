// Session helpers. Reads the session AuthContext already stores in Local Storage.
// PROTOTYPE ONLY: role checks based on Local Storage can be edited by anyone in dev tools.
import { makeId } from "./storage.js";

export const getSessionUser = () => {
  try { return JSON.parse(sessionStorage.getItem("loggedInUser") || "null"); }
  catch { return null; }
};
export const getSessionRole = () => (typeof sessionStorage === "undefined" ? null : sessionStorage.getItem("loggedInRole"));
export const isAdminSession = () => getSessionRole() === "admin";

// A "device" is simulated by a browser tab: each tab gets its own id.
export const getDeviceId = () => {
  try {
    let id = sessionStorage.getItem("deviceId");
    if (!id) {
      id = makeId("dev");
      sessionStorage.setItem("deviceId", id);
    }
    return id;
  } catch {
    return "dev_fallback";
  }
};
