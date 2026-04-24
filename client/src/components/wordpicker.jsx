import React, { useState, useEffect } from "react";
export default function WordPicker({ words, onPick, timeLeft = 15 }) {
const [time, setTime] = useState(timeLeft);
useEffect(() => {
const t = setInterval(() => setTime(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
return () => clearInterval(t);
}, []);
return (
<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
<div style={{ background: "var(--surface)", borderRadius: 20, padding: 40, textAlign: "center", minWidth: 360 }}>
<h2 style={{ marginBottom: 8, color: "var(--accent2)" }}>Choose a word to draw!</h2>
<p style={{ color: "var(--text-dim)", marginBottom: 28, fontSize: 14 }}>Auto-selects in {time}s</p>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
{words.map(w => (
<button key={w} onClick={() => onPick(w)} style={{ background: "var(--card)", color: "var(--text)", fontSize: 20, padding: "16px 24px", borderRadius: 12, border: "2px solid var(--border)", transition: "all 0.15s" }}
onMouseEnter={e => e.target.style.borderColor = "var(--accent)"} onMouseLeave={e => e.target.style.borderColor = "var(--border)"}>
{w}
</button>
))}
</div>
</div>
</div>
);
}
