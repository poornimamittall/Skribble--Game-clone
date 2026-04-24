import React, { useState, useEffect, useRef } from "react";
import Canvas from "../components/canvas";
import Chat from "../components/chat";
import PlayerList from "../components/playerlist";
import WordPicker from "../components/wordpicker";
import Timer from "../components/timer";
import { useSocket } from "../hooks/usesocket";
export default function Game({ roomData, roundData, onGameOver }) {
const [players, setPlayers] = useState(roomData.players || []);
const [phase, setPhase] = useState("choosing");
const [drawerId, setDrawerId] = useState(roundData.drawerId);
const [drawerName, setDrawerName] = useState(roundData.drawerName);
const [round, setRound] = useState(roundData.round || 1);
const [totalRounds, setTotalRounds] = useState(roundData.totalRounds || roomData.settings?.rounds || 3);
const [hint, setHint] = useState("");
const [wordOptions, setWordOptions] = useState(roundData.wordOptions || null);
const [messages, setMessages] = useState([]);
const [drawTime, setDrawTime] = useState(roundData.drawTime || roomData.settings?.drawTime || 80);
const [timerKey, setTimerKey] = useState(0);
const [roundEndInfo, setRoundEndInfo] = useState(null);
const is_first_round = useRef(true);
const myId = roomData.playerId;
const is_drawer = drawerId === myId;
const myPlayer = players.find(p => p.id === myId);
const has_guessed = myPlayer?.hasGuessed || false;
const can_draw = is_drawer && phase === "drawing";
const add_msg = (msg) => setMessages(p => [...p, msg]);
const socket = useSocket({
game_state: (data) => {
setPhase(data.phase);
setDrawerId(data.drawerId);
setHint(data.hint || "");
setTimerKey(k => k + 1);
setDrawTime(data.timeLeft || roomData.settings?.drawTime || 80);
setRoundEndInfo(null);
},
round_start: (data) => {
if (is_first_round.current) {
is_first_round.current = false;
return;
}
setRound(data.round);
setTotalRounds(data.totalRounds);
setDrawerId(data.drawerId);
setDrawerName(data.drawerName);
setHint("");
setPhase("choosing");
setWordOptions(null);
setRoundEndInfo(null);
setPlayers(p => p.map(pl => ({ ...pl, hasGuessed: false })));
add_msg({ type: "system", text: `Round ${data.round} started! ${data.drawerName} is drawing.`, isCorrect: false });
},
word_options: (data) => {
is_first_round.current = false;
setWordOptions(data.words);
setPhase("choosing");
},
hint_update: (data) => setHint(data.hint),
guess_result: (data) => {
setPlayers(data.players);
if (data.correct) {
add_msg({ type: "system", text: `🎉 ${data.playerName} guessed the word! +${data.points} pts`, isCorrect: true });
}
},
chat_message: (data) => {
add_msg({ type: "chat", playerName: data.playerName, text: data.text });
},
round_end: (data) => {
setRoundEndInfo(data);
add_msg({ type: "system", text: `Round over! The word was: ${data.word}`, isCorrect: false });
setPlayers(data.players);
setPhase("roundEnd");
},
game_over: (data) => onGameOver(data),
player_joined: (data) => setPlayers(data.players),
player_left: (data) => setPlayers(data.players)
});
const send_guess = (text) => {
socket.emit("guess", { roomId: roomData.roomId, playerId: myId, text });
};
const send_chat = (text) => {
socket.emit("chat", { roomId: roomData.roomId, playerId: myId, text });
};
const pick_word = (word) => {
socket.emit("word_chosen", { roomId: roomData.roomId, playerId: myId, word });
setWordOptions(null);
setPhase("drawing");
};
const display_hint = hint.split("").join("");
return (
<div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 12, gap: 10 }}>
<div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", borderRadius: 12, padding: "10px 16px" }}>
<span style={{ fontFamily: "Fredoka One, cursive", fontSize: 22, color: "var(--accent)" }}>🎨 Scribble!</span>
<div style={{ flex: 1, textAlign: "center" }}>
<div style={{ fontSize: 13, color: "var(--text-dim)" }}>Round {round} of {totalRounds}</div>
{is_drawer ? (
phase === "choosing"
? <div style={{ fontWeight: 800, fontSize: 18, color: "var(--accent2)" }}>Pick a word to draw!</div>
: <div style={{ fontWeight: 800, fontSize: 18, color: "var(--accent2)" }}>You're drawing!</div>
) : (
<div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 6, color: "var(--text)" }}>{display_hint || (phase === "choosing" ? "Waiting for drawer..." : "")}</div>
)}
</div>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
{phase === "drawing" && <Timer key={timerKey} initialTime={drawTime} />}
<div style={{ textAlign: "right", fontSize: 13 }}>
<div style={{ color: "var(--text-dim)" }}>Drawing:</div>
<div style={{ fontWeight: 700, color: "var(--text)" }}>{drawerName}</div>
</div>
</div>
</div>
<div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
<div style={{ width: 170, flexShrink: 0 }}>
<PlayerList players={players} drawerId={drawerId} />
</div>
<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
<Canvas is_drawer={can_draw} socket={socket} roomId={roomData.roomId} playerId={myId} />
</div>
<div style={{ width: 220, flexShrink: 0 }}>
<Chat messages={messages} onSend={is_drawer ? send_chat : send_guess} disabled={has_guessed && !is_drawer} isDrawer={is_drawer} />
</div>
</div>
{wordOptions && is_drawer && <WordPicker words={wordOptions} onPick={pick_word} />}
{roundEndInfo && (
<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99 }}>
<div style={{ background: "var(--surface)", borderRadius: 20, padding: 36, textAlign: "center", minWidth: 320 }}>
<h2 style={{ color: "var(--accent)", marginBottom: 8 }}>Round Over!</h2>
<p style={{ color: "var(--text-dim)", marginBottom: 4, fontSize: 15 }}>The word was:</p>
<p style={{ fontSize: 28, fontWeight: 800, color: "var(--accent2)", marginBottom: 20 }}>{roundEndInfo.word}</p>
<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
{[...roundEndInfo.players].sort((a, b) => b.score - a.score).map(p => (
<div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "var(--card)", borderRadius: 8 }}>
<span>{p.name}</span><span style={{ fontWeight: 800, color: "var(--accent2)" }}>{p.score}</span>
</div>
))}
</div>
<p style={{ color: "var(--text-dim)", marginTop: 16, fontSize: 13 }}>Next round starting...</p>
</div>
</div>
)}
</div>
);
}