import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { movies, genres } from "../data";
import { getUsers } from "../store";
import { getAnalytics } from "../services/analytics";
import { getSubmissions, reviewSubmission } from "../services/creator";
import { KEYS } from "../config";
import { subscribe } from "../services/storage";
import { deleteUploadedMovie, getUploadedMovies, saveUploadedMovie, updateUploadedMovie, getSampleMovieStatus, updateSampleMovieStatus, getPublishedMovies, subscribeCatalogue } from "../services/catalogue";

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map(x => x.value));
  return <section className="panel analytics-panel"><h3>{title}</h3>{rows.length ? rows.map(row => <div className="bar-row" key={row.label}><div><span>{row.label}</span><strong>{row.value}</strong></div><div className="bar-track"><i style={{ width: `${Math.max(2, row.value / max * 100)}%` }} /></div></div>) : <p className="muted">No activity recorded yet.</p>}</section>;
}

const initialForm = { title: "", genre: "Sci-Fi", year: new Date().getFullYear(), description: "", thumbnailUrl: "" };
const formatSize = bytes => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Admin() {
  const users = getUsers();
  const [content, setContent] = useState(() => movies.map(m => ({ ...m, category: m.genre, status: getSampleMovieStatus(m.id) })));
  const [uploaded, setUploaded] = useState(() => getUploadedMovies());
  const [submissions, setSubmissions] = useState(() => getSubmissions());
  const [analytics, setAnalytics] = useState(() => getAnalytics());
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [rangeStart, setRangeStart] = useState(2010);
  const [rangeEnd, setRangeEnd] = useState(2030);

  useEffect(() => subscribe(KEYS.submissions, () => { setSubmissions(getSubmissions()); setAnalytics(getAnalytics()); }), []);
  useEffect(() => subscribeCatalogue(() => {
    setUploaded(getUploadedMovies());
    setContent(movies.map(m => ({ ...m, category: m.genre, status: getSampleMovieStatus(m.id) })));
  }), []);
  useEffect(() => {
    if (!videoFile) { setVideoPreview(""); return; }
    const url = URL.createObjectURL(videoFile);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const review = (id, status) => { const error = reviewSubmission(id, status); setMessage(error || `Submission ${status.toLowerCase()}.`); setSubmissions(getSubmissions()); setAnalytics(getAnalytics()); };
  const toggleStatus = id => {
    const current = getSampleMovieStatus(id);
    updateSampleMovieStatus(id, current === "Published" ? "Draft" : "Published");
    setContent(movies.map(m => ({ ...m, category: m.genre, status: getSampleMovieStatus(m.id) })));
  };
  const onFormChange = e => setForm(old => ({ ...old, [e.target.name]: e.target.value }));
  const handleUpload = async e => {
    e.preventDefault();
    if (!form.title.trim() || !videoFile) { setMessage("Add a movie title and choose a video file first."); return; }
    setSaving(true); setMessage("");
    try {
      const movie = await saveUploadedMovie({ ...form, file: videoFile });
      setUploaded(getUploadedMovies());
      setForm(initialForm); setVideoFile(null);
      setMessage(`${movie.title} was added to your local catalogue and is now visible in Movies and Home on this browser.`);
    } catch (error) { setMessage(error.message || "Could not save this video."); }
    finally { setSaving(false); }
  };
  const toggleUploaded = movie => {
    const next = movie.status === "Published" ? "Draft" : "Published";
    updateUploadedMovie(movie.id, { status: next });
    setUploaded(getUploadedMovies());
    setMessage(`${movie.title} moved to ${next.toLowerCase()}.`);
  };
  const removeUploaded = async movie => {
    if (!window.confirm(`Delete ${movie.title} and its locally stored video?`)) return;
    try { await deleteUploadedMovie(movie.id); setUploaded(getUploadedMovies()); setMessage(`${movie.title} was deleted from this browser.`); }
    catch { setMessage("Could not delete this video. Please try again."); }
  };

  const t = analytics?.totals;
  const publishedMovies = getPublishedMovies(movies);
  const totalVideos = publishedMovies.length;
  const validRange = Number(rangeStart) <= Number(rangeEnd);
  const countInRange = (start, end) => publishedMovies.filter(m => Number(m.year) >= start && Number(m.year) <= end).length;
  if (!analytics) return <Layout admin><main className="container feature-page"><div className="empty">Admin access required.</div></main></Layout>;
  return <Layout admin><main className="container feature-page">
    <div className="section-head admin-welcome"><div><span className="eyebrow">LET'S VIBE · STUDIO</span><h2>Admin dashboard</h2><p>Manage your catalogue, publish movies and moderate creator submissions.</p></div><span className="admin-live-pill"><i/> Front-end demo</span></div>
    <section className="stats-grid">
      {[['Registered users', t.users], ['Available videos', totalVideos], ['Watch sessions', t.watchSessions], ['Rooms created', t.roomsCreated], ['Open rooms', t.roomsOpen], ['Creator submissions', t.submissions]].map(([label, value]) => <div className="stat-card" key={label}><h3>{label}</h3><p className="stat-number">{value}</p></div>)}
    </section>

    <section className="table-card">
      <h2>Published movies · year-wise statistics</h2>
      <div className="stats-grid">
        <div className="stat-card"><h3>2010–2020</h3><p className="stat-number">{countInRange(2010, 2020)}</p></div>
        <div className="stat-card"><h3>2021–2030</h3><p className="stat-number">{countInRange(2021, 2030)}</p></div>
      </div>
      <h3>Custom year range</h3>
      <div className="filter-bar">
        <label>Start year<input type="number" min="1900" max="2100" value={rangeStart} onChange={e => setRangeStart(e.target.value)} /></label>
        <label>End year<input type="number" min="1900" max="2100" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} /></label>
      </div>
      {validRange ? <p><strong>{countInRange(Number(rangeStart), Number(rangeEnd))}</strong> published movies from {rangeStart} to {rangeEnd}.</p> : <p className="feature-message">End year must be greater than or equal to start year.</p>}
    </section>

    <section className="admin-upload panel">
      <div className="admin-upload-heading"><div><span className="eyebrow">CONTENT STUDIO</span><h2>Upload a new OTT movie</h2><p>Add a video from your computer and publish it to the Let's Vibe catalogue.</p></div><button type="button" className="btn btn-outline" onClick={() => setShowUpload(v => !v)}>{showUpload ? "Hide form" : "+ Add movie"}</button></div>
      {showUpload && <form className="upload-form" onSubmit={handleUpload}>
        <div className="upload-fields">
          <label>Movie title<input name="title" value={form.title} onChange={onFormChange} placeholder="e.g. Beyond the Stars" required maxLength="80" /></label>
          <label>Genre<select name="genre" value={form.genre} onChange={onFormChange}>{[...genres, "Romance", "Documentary", "Animation", "Short Film"].map(g => <option key={g}>{g}</option>)}</select></label>
          <label>Release year<input name="year" type="number" min="1900" max="2100" value={form.year} onChange={onFormChange} /></label>
          <label>Thumbnail URL <span className="muted">(optional)</span><input name="thumbnailUrl" type="url" value={form.thumbnailUrl} onChange={onFormChange} placeholder="https://example.com/poster.jpg" /></label>
          <label className="upload-description">Description<textarea name="description" value={form.description} onChange={onFormChange} rows="3" placeholder="Write a short movie description..." /></label>
        </div>
        <div className="video-dropzone">
          <div className="upload-icon">↑</div><strong>{videoFile ? videoFile.name : "Choose your movie video"}</strong>
          <span>{videoFile ? `${formatSize(videoFile.size)} · ${videoFile.type || "Video file"}` : "MP4, WebM or other browser-supported video formats"}</span>
          <label className="btn btn-small file-picker">Browse files<input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></label>
        </div>
        {videoPreview && <div className="upload-preview"><video src={videoPreview} controls preload="metadata" /><span>Local preview before publishing</span></div>}
        <div className="upload-submit-row"><p className="prototype-note">Video is saved in this browser's IndexedDB. It survives refresh in the same browser profile, but is not uploaded to Vercel or shared with other devices.</p><button className="btn" type="submit" disabled={saving || !videoFile}>{saving ? "Adding movie..." : "Publish movie ↗"}</button></div>
      </form>}
    </section>

    <div className="analytics-grid"><Bars title="Most-watched content" rows={analytics.mostWatched} /><Bars title="Popular genres" rows={analytics.genres.filter(x => x.value > 0)} /><Bars title="Creator submission status" rows={analytics.submissionStatus} /><Bars title="Cumulative user signups" rows={analytics.userGrowth} /></div>
    <section className="table-card"><h2>Creator submissions · review queue</h2><table><thead><tr><th>Video</th><th>Creator</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead><tbody>{submissions.length ? submissions.map(s => <tr key={s.id}><td><strong>{s.title}</strong><br/><a href={s.videoUrl} target="_blank" rel="noreferrer">Preview video ↗</a></td><td>{s.creatorName || "Demo creator"}</td><td>{s.category}</td><td><span className={`status ${s.status.toLowerCase()}`}>{s.status}</span></td><td>{s.status !== "Approved" && <button className="btn btn-small" onClick={() => review(s.id, "Approved")}>Approve</button>} {s.status !== "Rejected" && <button className="btn btn-small btn-outline" onClick={() => review(s.id, "Rejected")}>Reject</button>}</td></tr>) : <tr><td colSpan="5">No creator submissions yet.</td></tr>}</tbody></table></section>
    <section className="table-card"><h2>Registered users</h2><table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Joined</th></tr></thead><tbody>{users.map((u, i) => <tr key={u.email}><td>{i+1}</td><td>{u.name}</td><td>{u.email}</td><td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Earlier account"}</td></tr>)}</tbody></table></section>
    <section className="table-card"><div className="catalogue-heading"><h2>Manage uploaded OTT movies</h2><span>{uploaded.length} uploaded</span></div>{uploaded.length ? <table><thead><tr><th>Movie</th><th>Category</th><th>File</th><th>Status</th><th>Actions</th></tr></thead><tbody>{uploaded.map(m => <tr key={m.id}><td><strong>{m.title}</strong><small className="table-subtitle">{m.year}</small></td><td>{m.genre}</td><td>{m.fileName}<small className="table-subtitle">{formatSize(m.fileSize)}</small></td><td><span className={`status ${m.status.toLowerCase()}`}>{m.status}</span></td><td><button className="btn btn-small btn-outline" onClick={() => toggleUploaded(m)}>{m.status === "Published" ? "Unpublish" : "Publish"}</button> <button className="btn btn-small btn-danger-outline" onClick={() => removeUploaded(m)}>Delete</button></td></tr>)}</tbody></table> : <p className="empty-inline">No uploaded movies yet. Use the upload form above to add your first movie.</p>}</section>
    <section className="table-card"><h2>Manage sample catalogue</h2><table><thead><tr><th>Movie</th><th>Category</th><th>Status</th><th>Action</th></tr></thead><tbody>{content.map(c => <tr key={c.title}><td>{c.title}</td><td>{c.category}</td><td>{c.status}</td><td><button className="btn btn-small btn-outline" onClick={() => toggleStatus(c.id)}>Toggle status</button></td></tr>)}</tbody></table></section>
    {message && <p className="feature-message" role="status">{message}</p>}
    <p className="prototype-note">This is a front-end prototype. Uploaded videos are stored only in this browser. They remain available after refresh on this device, but are not hosted publicly through Vercel. Analytics use local demo activity; private watch histories and passwords are not displayed.</p>
  </main></Layout>;
}
