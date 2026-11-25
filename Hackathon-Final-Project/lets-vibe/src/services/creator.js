// Indie Creator Corner submissions (Local Storage prototype).
// No real video hosting or copyright licensing exists: creators paste links to videos hosted elsewhere.
import { KEYS } from "../config.js";
import { read, write, makeId } from "./storage.js";
import { isAdminSession } from "./session.js";
import { SAMPLE_VIDEOS } from "../data.js";

export const CATEGORIES = ["Short Film", "Animation", "Music Video", "Documentary", "Comedy", "Experimental"];
export const STATUSES = ["Pending", "Approved", "Rejected"];

const isHttp = (v) => /^https?:\/\/\S+$/i.test(String(v || "").trim());

// Clearly-labelled demo entries (demo: true) so the public page is not empty on first run.
const seedDemo = () => [
  { id: "demo_1", title: "Monsoon Window (demo)", description: "Sample entry showing how an approved creator video looks.", category: "Short Film", thumbnailUrl: "https://picsum.photos/seed/monsoon-window/640/360", videoUrl: SAMPLE_VIDEOS[0], creatorEmail: "demo-creator@example.com", creatorName: "Demo Creator", status: "Approved", createdAt: Date.now(), demo: true },
  { id: "demo_2", title: "Paper Boat Blues (demo)", description: "Sample animation entry. Replace with real submissions.", category: "Animation", thumbnailUrl: "https://picsum.photos/seed/paper-boat/640/360", videoUrl: SAMPLE_VIDEOS[1], creatorEmail: "demo-creator@example.com", creatorName: "Demo Creator", status: "Approved", createdAt: Date.now(), demo: true },
];

export const getSubmissions = () => {
  const stored = read(KEYS.submissions, null);
  if (stored === null) {
    const seeded = seedDemo();
    write(KEYS.submissions, seeded);
    return seeded;
  }
  return stored;
};

export const getApproved = () => getSubmissions().filter((s) => s.status === "Approved");
export const getMine = (email) => getSubmissions().filter((s) => s.creatorEmail === email);
export const getSubmission = (id) => getSubmissions().find((s) => s.id === id) || null;

export function submitVideo(user, { title, description, category, thumbnailUrl, videoUrl }) {
  if (!title?.trim()) return { error: "Title is required." };
  if (!description?.trim()) return { error: "Description is required." };
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };
  if (!isHttp(thumbnailUrl)) return { error: "Thumbnail URL must start with http:// or https://" };
  if (!isHttp(videoUrl)) return { error: "Video URL must start with http:// or https://" };
  const item = {
    id: makeId("sub"),
    title: title.trim(),
    description: description.trim(),
    category,
    thumbnailUrl: thumbnailUrl.trim(),
    videoUrl: videoUrl.trim(),
    creatorEmail: user.email,
    creatorName: user.name,
    status: "Pending",
    createdAt: Date.now(),
  };
  write(KEYS.submissions, [...getSubmissions(), item]);
  return { item };
}

// Admin action. PROTOTYPE: guarded by a Local Storage role check, which is not real security.
export function reviewSubmission(id, status) {
  if (!isAdminSession()) return "Only admins can review submissions.";
  if (!["Approved", "Rejected", "Pending"].includes(status)) return "Invalid status.";
  write(KEYS.submissions, getSubmissions().map((s) => (s.id === id ? { ...s, status, reviewedAt: Date.now() } : s)));
  return null;
}
