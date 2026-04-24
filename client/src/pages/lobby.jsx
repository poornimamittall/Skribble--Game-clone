import React, { useState, useRef } from "react";
import { useSocket } from "../hooks/usesocket";
export default function Lobby({ roomData, onGameStart, onPlayerUpdate }) {
const [players, setPlayers] = useState(roomData.players || []);
const [copied, setCopied] = useState(false);
const pending_round = useRef(null);
const pending_words = useRef(null);
const is_host = roomData.playerId === (roomData.hostId || roomData.players?.[0]?.id);
const link = `${window.location.origin}?room=${roomData.roomId}`;
const try_start_game = (round_data, words_data) => {
if (round_data && words_data) {
onGameStart({ ...round_data, wordOptions: words_data });
} else if (round_data && round_data.drawerId !== roomData.playerId) {
onGameStart({ ...round_data, wordOptions: null });
}
};
const socket = useSocket({
player_joined: (data) => { setPlayers(data.players); onPlayerUpdate(data.players); },
player_left: (data) => { setPlayers(data.players); onPlayerUpdate(data.players); },
round_start: (data) => {
pending_round.current = data;
try_start_game(pending_round.current, pending_words.current);
},
word_options: (data) => {
pending_words.current = data.words;
try_start_game(pending_round.current, pending_words.current);
},
host_changed: () => {}
});
const start = () => socket.emit("start_game", { roomId: roomData.roomId, playerId: roomData.playerId });
const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
return (
<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
<h1 style={{ color: "var(--accent)", fontSize: 40, marginBottom: 8 }}>🎨 Lobby</h1>
<p style={{ color: "var(--text-dim)", marginBottom: 4 }}>Room Code: <strong style={{ color: "var(--accent2)", fontSize: 22, letterSpacing: 3 }}>{roomData.roomId}</strong></p>
<div style={{ background: "var(--surface)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, marginTop: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
<h2 style={{ color: "var(--text)" }}>Players ({players.length}/{roomData.settings?.maxPlayers || 10})</h2>
<button onClick={copy} style={{ background: "var(--card)", color: "var(--text)", fontSize: 13, padding: "8px 14px" }}>
{copied ? "✓ Copied!" : "📋 Copy Link"}
</button>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
{players.map((p, i) => (
<div key={p.id} style={{ background: "var(--card)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
<span style={{ fontSize: 22 }}>{avatar_emoji(i)}</span>
<span style={{ fontWeight: 700, flex: 1 }}>{p.name}</span>
{i === 0 && <span style={{ background: "var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>HOST</span>}
</div>
))}
</div>
<div style={{ background: "var(--card)", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "var(--text-dim)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
<span>Rounds: <b style={{ color: "var(--text)" }}>{roomData.settings?.rounds}</b></span>
<span>Draw Time: <b style={{ color: "var(--text)" }}>{roomData.settings?.drawTime}s</b></span>
<span>Word Choices: <b style={{ color: "var(--text)" }}>{roomData.settings?.wordCount}</b></span>
<span>Hints: <b style={{ color: "var(--text)" }}>{roomData.settings?.hints}</b></span>
</div>
{is_host ? (
<button onClick={start} disabled={players.length < 2} style={{ width: "100%", background: players.length < 2 ? "var(--border)" : "var(--accent)", color: "#fff", fontSize: 20, padding: 16, borderRadius: 12 }}>
{players.length < 2 ? "Need at least 2 players" : "🚀 Start Game"}
</button>
) : (
<p style={{ textAlign: "center", color: "var(--text-dim)", padding: 12 }}>Waiting for host to start...</p>
)}
</div>
</div>
);
}
function avatar_emoji(i) {
const emojis = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐸","🐵","🐔","🦆","🦅","🦉","🦇","🐧"];
return emojis[i % emojis.length];
}