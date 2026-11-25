import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../AuthContext";
import { CATEGORIES, getApproved, getMine, submitVideo } from "../services/creator";
import { KEYS } from "../config";
import { subscribe } from "../services/storage";

const empty = { title: "", description: "", category: CATEGORIES[0], thumbnailUrl: "", videoUrl: "" };
export default function CreatorCorner() {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState(() => getApproved());
  const [mine, setMine] = useState(() => getMine(user.email));
  const [message, setMessage] = useState("");
  useEffect(() => subscribe(KEYS.submissions, () => { setItems(getApproved()); setMine(getMine(user.email)); }), [user.email]);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = e => { e.preventDefault(); const result = submitVideo(user, form); if (result.error) return setMessage(result.error); setForm(empty); setMessage("Your video was submitted and is awaiting admin review."); setMine(getMine(user.email)); };
  return <Layout><main className="container feature-page"><div className="section-head"><div><h2>Indie Creator Corner</h2><p>Discover independent stories and share your own creativity.</p></div></div>
    <section className="creator-grid">{items.map(item => <article className="creator-card" key={item.id}><img src={item.thumbnailUrl} alt="" onError={e => { e.currentTarget.src = "https://picsum.photos/seed/creator/640/360"; }} /><div className="creator-card-body"><span className="eyebrow">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><a className="btn btn-small" href={item.videoUrl} target="_blank" rel="noreferrer">Watch video ↗</a></div></article>)}</section>
    {!items.length && <div className="empty">No approved creator videos yet. Be the first to submit one.</div>}
    <section className="creator-submit panel"><div><h2>Submit your video</h2><p className="muted">Submissions are reviewed by an administrator before appearing publicly.</p></div><form onSubmit={submit} className="creator-form">
      <div className="form-group"><label>Video title</label><input name="title" value={form.title} onChange={change} required maxLength={80} /></div>
      <div className="form-group"><label>Category</label><select name="category" value={form.category} onChange={change}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={change} required rows="3" maxLength={500} /></div>
      <div className="form-group"><label>Thumbnail image URL</label><input name="thumbnailUrl" type="url" value={form.thumbnailUrl} onChange={change} placeholder="https://..." required /></div>
      <div className="form-group"><label>Video URL (MP4 or hosted video)</label><input name="videoUrl" type="url" value={form.videoUrl} onChange={change} placeholder="https://..." required /></div>
      <button className="btn" type="submit">Submit for review</button>
    </form></section>
    <section className="table-card"><h2>My submissions</h2>{mine.length ? <table><thead><tr><th>Title</th><th>Category</th><th>Status</th></tr></thead><tbody>{mine.map(x => <tr key={x.id}><td>{x.title}</td><td>{x.category}</td><td><span className={`status ${x.status.toLowerCase()}`}>{x.status}</span></td></tr>)}</tbody></table> : <p className="muted">You have not submitted any videos yet.</p>}</section>
    {message && <p className="feature-message">{message}</p>}<p className="prototype-note">Video URLs are hosted externally. This demo does not provide video storage, copyright verification or licensing.</p>
  </main></Layout>;
}
