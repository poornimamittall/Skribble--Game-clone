import React, { useState, useEffect } from "react";
import { getSocket } from "../hooks/usesocket";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
export default function Home({ onJoined }) {
const [tab, setTab] = useState("create");
const [name, setName] = useState("");
const [roomCode, setRoomCode] = useState("");
const [publicRooms, setPublicRooms] = useState([]);
const [settings, setSettings] = useState({ maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hints: 2, isPrivate: false });
const [error, setError] = useState("");
useEffect(() => {
const params = new URLSearchParams(window.location.search);
const code = params.get("room");
if (code) { setRoomCode(code); setTab("join"); }
}, []);
useEffect(() => {
if (tab === "browse") {
fetch(`${SERVER_URL}/rooms`).then(r => r.json()).then(setPublicRooms).catch(() => {});
}
}, [tab]);
const socket = getSocket();
useEffect(() => {
socket.on("room_created", (data) => onJoined(data));
socket.on("room_joined", (data) => onJoined(data));
socket.on("error", (data) => setError(data.message));
return () => { socket.off("room_created"); socket.off("room_joined"); socket.off("error"); };
}, []);
const create = () => {
if (!name.trim()) { setError("Enter your name"); return; }
socket.emit("create_room", { hostName: name.trim(), settings });
};
const join = (code) => {
if (!name.trim()) { setError("Enter your name"); return; }
socket.emit("join_room", { roomId: (code || roomCode).trim().toUpperCase(), playerName: name.trim() });
};
return (
<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
<h1 style={{ fontSize: 56, color: "var(--accent)", marginBottom: 8, textShadow: "0 4px 20px rgba(233,69,96,0.4)" }}>🎨 Scribble!</h1>
<p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 18 }}>Draw. Guess. Win.</p>
<div style={{ background: "var(--surface)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
<input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 20, fontSize: 16 }} maxLength={20} />
<div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
{["create","join","browse"].map(t => (
<button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "var(--accent)" : "var(--card)", color: "var(--text)", fontSize: 14, padding: "10px 0", borderRadius: 10 }}>
{t.charAt(0).toUpperCase()+t.slice(1)}
</button>
))}
</div>
{tab === "create" && (
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<Setting label="Max Players" value={settings.maxPlayers} onChange={v => setSettings(s => ({...s, maxPlayers: +v}))} options={[2,4,6,8,10,12]} />
<Setting label="Rounds" value={settings.rounds} onChange={v => setSettings(s => ({...s, rounds: +v}))} options={[2,3,4,5,6,7,8]} />
<Setting label="Draw Time (s)" value={settings.drawTime} onChange={v => setSettings(s => ({...s, drawTime: +v}))} options={[30,45,60,80,100,120,150,180]} />
<Setting label="Word Choices" value={settings.wordCount} onChange={v => setSettings(s => ({...s, wordCount: +v}))} options={[1,2,3,4,5]} />
<Setting label="Hints" value={settings.hints} onChange={v => setSettings(s => ({...s, hints: +v}))} options={[0,1,2,3,4,5]} />
<label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-dim)", cursor: "pointer" }}>
<input type="checkbox" checked={settings.isPrivate} onChange={e => setSettings(s => ({...s, isPrivate: e.target.checked}))} style={{ width: 18, height: 18 }} />
Private Room
</label>
<button onClick={create} style={{ background: "var(--accent)", color: "#fff", fontSize: 18, padding: "14px", marginTop: 8, borderRadius: 12 }}>Create Room</button>
</div>
)}
{tab === "join" && (
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<input placeholder="Room Code" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} style={{ fontSize: 24, textAlign: "center", letterSpacing: 4, fontWeight: 800 }} maxLength={6} />
<button onClick={() => join()} style={{ background: "var(--accent)", color: "#fff", fontSize: 18, padding: "14px", borderRadius: 12 }}>Join Room</button>
</div>
)}
{tab === "browse" && (
<div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
{publicRooms.length === 0 && <p style={{ color: "var(--text-dim)", textAlign: "center", padding: 20 }}>No open rooms found</p>}
{publicRooms.map(r => (
<div key={r.id} style={{ background: "var(--card)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<span style={{ fontWeight: 700 }}>Room #{r.id}</span>
<span style={{ color: "var(--text-dim)", fontSize: 13 }}>{r.playerCount}/{r.maxPlayers} players · {r.rounds} rounds</span>
<button onClick={() => join(r.id)} style={{ background: "var(--green)", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 13 }}>Join</button>
</div>
))}
</div>
)}
{error && <p style={{ color: "var(--accent)", marginTop: 12, textAlign: "center" }}>{error}</p>}
</div>
</div>
);
}
function Setting({ label, value, onChange, options }) {
return (
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<span style={{ color: "var(--text-dim)", fontWeight: 600 }}>{label}</span>
<select value={value} onChange={e => onChange(e.target.value)} style={{ width: 120 }}>
{options.map(o => <option key={o} value={o}>{o}</option>)}
</select>
</div>
);
}
