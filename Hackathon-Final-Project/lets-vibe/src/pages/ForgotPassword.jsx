import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "error" });

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password || !confirm) return setMessage({ text: "Please complete every field.", type: "error" });
    if (password !== confirm) return setMessage({ text: "Your passwords do not match.", type: "error" });
    const error = resetPassword(email, password);
    if (error) return setMessage({ text: error, type: "error" });
    setMessage({ text: "Demo password updated. You can now log in.", type: "success" });
    window.setTimeout(() => navigate("/login"), 1100);
  };

  return <div className="auth-page"><header className="auth-nav"><Link className="logo" to="/login">Let's Vibe</Link></header><main className="form-wrap"><section className="form-card"><span className="eyebrow">ACCOUNT RECOVERY</span><h2>Reset password</h2><p className="hint">Enter your registered demo email and choose a new password.</p><form onSubmit={submit}><div className="form-group"><label>Registered email</label><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="form-group"><label>New password</label><input type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} /></div><div className="form-group"><label>Confirm new password</label><input type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div><button className="btn btn-block" type="submit">Update password</button><p className={`message ${message.type}`}>{message.text}</p></form><p className="form-foot"><Link to="/login">← Back to login</Link></p><div className="demo-box">Front-end demonstration only: this updates the password stored in this browser. It does not send a reset email.</div></section></main></div>;
}
