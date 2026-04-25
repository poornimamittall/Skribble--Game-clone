import React from "react";
const EMOJIS = ["🐶","🐱","🐭","🐹","🐰","🐙","🐻","🐼","🐨","🐯","🐞","🐮","🐸","🐵","🐔","🐾","🐷","🐈","🙈","🐧"];
export default function PlayerList({ players, drawerId }) {
const sorted = [...players].sort((a, b) => b.score - a.score);
return (
<div style={{ background: "var(--surface)", borderRadius: 12, overflow: "hidden", height: "100%" }}>
<div style={{ padding: "10px 14px", background: "var(--card)", fontWeight: 700, fontSize: 14, borderBottom: "1px solid var(--border)" }}>👥 Players</div>
<div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
{sorted.map((p, i) => (
<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: p.id === drawerId ? "rgba(233,69,96,0.15)" : "transparent", borderLeft: p.id === drawerId ? "3px solid var(--accent)" : "3px solid transparent" }}>
<span style={{ fontSize: 20 }}>{EMOJIS[players.indexOf(p) % EMOJIS.length]}</span>
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name} {p.id === drawerId && "✏️"}</div>
{p.hasGuessed && <div style={{ fontSize: 11, color: "#4caf50" }}>✓ Guessed!</div>}
</div>
<div style={{ fontWeight: 800, color: "var(--accent2)", fontSize: 16 }}>{p.score}</div>
</div>
))}
</div>
</div>
);
}
