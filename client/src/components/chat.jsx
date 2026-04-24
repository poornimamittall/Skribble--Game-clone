import React, { useState, useRef, useEffect } from "react";
export default function Chat({ messages, onSend, disabled, isDrawer }) {
const [input, setInput] = useState("");
const bottomRef = useRef(null);
useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
const send = () => {
if (!input.trim() || disabled) return;
onSend(input.trim());
setInput("");
};
return (
<div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", borderRadius: 12, overflow: "hidden" }}>
<div style={{ padding: "10px 14px", background: "var(--card)", fontWeight: 700, fontSize: 14, borderBottom: "1px solid var(--border)" }}>💬 Chat & Guesses</div>
<div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
{messages.map((m, i) => (
<div key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>
{m.type === "system" ? (
<span style={{ color: m.isCorrect ? "#4caf50" : "var(--accent2)", fontStyle: "italic" }}>{m.text}</span>
) : (
<><span style={{ color: "var(--accent2)", fontWeight: 700 }}>{m.playerName}: </span><span style={{ color: "var(--text)" }}>{m.text}</span></>
)}
</div>
))}
<div ref={bottomRef} />
</div>
<div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid var(--border)" }}>
<input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={isDrawer ? "You're drawing..." : disabled ? "You already guessed!" : "Type your guess..."} disabled={isDrawer || disabled} style={{ flex: 1, fontSize: 14, opacity: (isDrawer || disabled) ? 0.5 : 1 }} />
<button onClick={send} disabled={isDrawer || disabled} style={{ background: "var(--accent)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 14, opacity: (isDrawer || disabled) ? 0.5 : 1 }}>Send</button>
</div>
</div>
);
}
