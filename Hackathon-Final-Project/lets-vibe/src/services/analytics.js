// Admin-only AGGREGATE analytics. Never returns passwords, emails or per-user viewing history.
import { KEYS } from "../config.js";
import { read } from "./storage.js";
import { isAdminSession } from "./session.js";
import { movies, genres } from "../data.js";
import { getSubmissions } from "./creator.js";
import { getAllRooms } from "./rooms.js";

const tally = (items, keyFn) => {
  const map = new Map();
  items.forEach((i) => map.set(keyFn(i), (map.get(keyFn(i)) || 0) + 1));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const titleOf = (contentId) => {
  if (String(contentId).startsWith("c:")) {
    const s = getSubmissions().find((x) => x.id === String(contentId).slice(2));
    return s ? s.title : "Creator video";
  }
  return movies.find((m) => m.id === Number(contentId))?.title || `Content ${contentId}`;
};

// includeDemo=false -> only real activity recorded by this app.
export function getAnalytics({ includeDemo = false } = {}) {
  if (!isAdminSession()) return null; // prototype-level guard; the page is also route-protected
  const users = read("users", []);
  const log = read(KEYS.watchLog, []).filter((l) => includeDemo || !l.demo);
  const subs = getSubmissions().filter((s) => includeDemo || !s.demo);
  const rooms = getAllRooms();

  const growth = tally(users.filter((u) => u.createdAt), (u) => new Date(u.createdAt).toISOString().slice(0, 10))
    .sort((a, b) => a.label.localeCompare(b.label));
  let running = 0;
  const growthCumulative = growth.map((g) => ({ label: g.label, value: (running += g.value) }));

  return {
    totals: {
      users: users.length,
      content: movies.length + subs.filter((s) => s.status === "Approved").length,
      watchSessions: log.length,
      roomsCreated: rooms.length,
      roomsOpen: rooms.filter((r) => r.status === "open").length,
      submissions: subs.length,
      approved: subs.filter((s) => s.status === "Approved").length,
      pending: subs.filter((s) => s.status === "Pending").length,
      rejected: subs.filter((s) => s.status === "Rejected").length,
    },
    mostWatched: tally(log, (l) => l.contentId).slice(0, 5).map((r) => ({ label: titleOf(r.label), value: r.value })),
    genres: genres.map((g) => ({ label: g, value: log.filter((l) => l.genre === g).length })).sort((a, b) => b.value - a.value),
    moods: null, // the data model has no mood field, so no mood statistics are shown
    userGrowth: growthCumulative, // only users who signed up after createdAt was added
    usersWithoutDate: users.filter((u) => !u.createdAt).length,
    submissionStatus: [
      { label: "Approved", value: subs.filter((s) => s.status === "Approved").length },
      { label: "Pending", value: subs.filter((s) => s.status === "Pending").length },
      { label: "Rejected", value: subs.filter((s) => s.status === "Rejected").length },
    ],
  };
}
