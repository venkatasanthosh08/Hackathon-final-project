import { useState } from "react";
import Layout from "../components/Layout";
import { PLANS, PLAN_ORDER } from "../config";
import { getPlanId, selectPlan } from "../services/plans";
import { useAuth } from "../AuthContext";

export default function Subscription() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(() => getPlanId(user.email));
  const [message, setMessage] = useState("");
  const choose = (id) => {
    const error = selectPlan(user.email, id);
    if (error) return setMessage(error);
    setCurrent(id);
    setMessage(`${PLANS[id].name} selected. This is a demo subscription; no payment was taken.`);
  };
  return <Layout><main className="container feature-page">
    <div className="section-head"><div><h2>Choose your vibe</h2><p>Pick the plan that fits how you stream.</p></div><span className="plan-pill">Current: {PLANS[current].name}</span></div>
    <div className="plan-grid">{PLAN_ORDER.map((id) => { const p = PLANS[id]; return <article className={`plan-card ${id === "premium" ? "featured" : ""}`} key={id}>
      {id === "premium" && <span className="plan-ribbon">GROUP WATCH</span>}<h2>{p.name}</h2><div className="plan-price">{id === "basic" ? "Free demo" : "Demo plan"}</div><p className="muted">{p.maxDevices} simultaneous devices</p>
      <ul>{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul><button className={`btn btn-block ${current === id ? "btn-outline" : ""}`} onClick={() => choose(id)}>{current === id ? "Your current plan" : `Choose ${p.name}`}</button>
    </article>; })}</div>
    {message && <p className="feature-message">{message}</p>}
    <p className="prototype-note">Demo subscription only. No payment gateway is connected. Plan limits are simulated in this browser.</p>
  </main></Layout>;
}
