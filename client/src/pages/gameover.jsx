import React from "react";
const EMOJIS = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
export default function GameOver({ data, onPlayAgain }) {
const leaderboard = data.leaderboard || [];
const winner = data.winner;
return (
<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
<div style={{ textAlign: "center", marginBottom: 32 }}>
<div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
<h1 style={{ fontSize: 40, color: "var(--accent)", marginBottom: 8 }}>Game Over!</h1>
{winner && <p style={{ fontSize: 22, color: "var(--accent2)", fontWeight: 700 }}>{winner.name} wins!</p>}
</div>
<div style={{ background: "var(--surface)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
<h2 style={{ marginBottom: 20, textAlign: "center" }}>Final Scores</h2>
<div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
{leaderboard.map((p, i) => (
<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(245,166,35,0.15)" : "var(--card)", border: i === 0 ? "2px solid var(--accent2)" : "2px solid transparent", borderRadius: 12, padding: "14px 16px" }}>
<span style={{ fontSize: 22 }}>{EMOJIS[i] || "🎮"}</span>
<span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{p.name}</span>
<span style={{ fontWeight: 800, fontSize: 20, color: "var(--accent2)" }}>{p.score}</span>
</div>
))}
</div>
<button onClick={onPlayAgain} style={{ width: "100%", background: "var(--accent)", color: "#fff", fontSize: 18, padding: 16, borderRadius: 12 }}>
🏠 Back to Home
</button>
</div>
</div>
);
}
