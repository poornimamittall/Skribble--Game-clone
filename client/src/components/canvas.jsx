import React, { useRef, useEffect, useState, useCallback } from "react";
const COLORS = ["#000000","#ffffff","#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#ff5722","#795548","#607d8b","#4caf50","#00bcd4","#673ab7","#ff4081","#ffeb3b","#8bc34a","#ff9800"];
export default function Canvas({ is_drawer, socket, roomId, playerId }) {
const canvas_ref = useRef(null);
const drawing = useRef(false);
const last_pos = useRef(null);
const [color, setColor] = useState("#000000");
const [size, setSize] = useState(4);
const [tool, setTool] = useState("pen");
const get_pos = (e, canvas) => {
const rect = canvas.getBoundingClientRect();
const scale_x = canvas.width / rect.width;
const scale_y = canvas.height / rect.height;
if (e.touches) {
return { x: (e.touches[0].clientX - rect.left) * scale_x, y: (e.touches[0].clientY - rect.top) * scale_y };
}
return { x: (e.clientX - rect.left) * scale_x, y: (e.clientY - rect.top) * scale_y };
};
const draw_stroke = useCallback((ctx, stroke) => {
if (stroke.type === "start") {
ctx.beginPath();
ctx.strokeStyle = stroke.color;
ctx.lineWidth = stroke.size;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.moveTo(stroke.x, stroke.y);
} else if (stroke.type === "move") {
ctx.lineTo(stroke.x, stroke.y);
ctx.stroke();
}
}, []);
const replay_strokes = useCallback((strokes) => {
const canvas = canvas_ref.current;
if (!canvas) return;
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
strokes.forEach(s => draw_stroke(ctx, s));
}, [draw_stroke]);
useEffect(() => {
if (!socket) return;
const on_data = (stroke) => {
const canvas = canvas_ref.current;
if (!canvas) return;
const ctx = canvas.getContext("2d");
draw_stroke(ctx, stroke);
};
const on_clear = () => {
const canvas = canvas_ref.current;
if (!canvas) return;
canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
};
const on_state = ({ strokes }) => replay_strokes(strokes);
socket.on("draw_data", on_data);
socket.on("canvas_cleared", on_clear);
socket.on("canvas_state", on_state);
socket.emit("request_canvas", { roomId });
return () => {
socket.off("draw_data", on_data);
socket.off("canvas_cleared", on_clear);
socket.off("canvas_state", on_state);
};
}, [socket, roomId, draw_stroke, replay_strokes]);
const start_draw = (e) => {
if (!is_drawer) return;
e.preventDefault();
drawing.current = true;
const canvas = canvas_ref.current;
const ctx = canvas.getContext("2d");
const pos = get_pos(e, canvas);
const actual_color = tool === "eraser" ? "#ffffff" : color;
const actual_size = tool === "eraser" ? size * 4 : size;
ctx.beginPath();
ctx.strokeStyle = actual_color;
ctx.lineWidth = actual_size;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.moveTo(pos.x, pos.y);
last_pos.current = pos;
socket.emit("draw_start", { roomId, x: pos.x, y: pos.y, color: actual_color, size: actual_size });
};
const move_draw = (e) => {
if (!is_drawer || !drawing.current) return;
e.preventDefault();
const canvas = canvas_ref.current;
const ctx = canvas.getContext("2d");
const pos = get_pos(e, canvas);
ctx.lineTo(pos.x, pos.y);
ctx.stroke();
last_pos.current = pos;
socket.emit("draw_move", { roomId, x: pos.x, y: pos.y });
};
const end_draw = (e) => {
if (!is_drawer || !drawing.current) return;
drawing.current = false;
socket.emit("draw_end", { roomId });
};
const clear_canvas = () => {
const canvas = canvas_ref.current;
canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
socket.emit("canvas_clear", { roomId, playerId });
};
const undo_stroke = () => socket.emit("draw_undo", { roomId, playerId });
return (
<div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
<canvas ref={canvas_ref} width={800} height={500} style={{ background: "#fff", borderRadius: 12, width: "100%", touchAction: "none", cursor: is_drawer ? (tool === "eraser" ? "cell" : "crosshair") : "not-allowed", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
onMouseDown={start_draw} onMouseMove={move_draw} onMouseUp={end_draw} onMouseLeave={end_draw}
onTouchStart={start_draw} onTouchMove={move_draw} onTouchEnd={end_draw} />
{is_drawer && (
<div style={{ background: "var(--surface)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
{COLORS.map(c => (
<div key={c} onClick={() => { setColor(c); setTool("pen"); }} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c && tool === "pen" ? "3px solid var(--accent)" : "2px solid rgba(255,255,255,0.2)", transition: "transform 0.1s" }} />
))}
</div>
<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
<span style={{ color: "var(--text-dim)", fontSize: 13, minWidth: 30 }}>Size:</span>
<input type="range" min={2} max={30} value={size} onChange={e => setSize(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
<span style={{ color: "var(--text)", fontWeight: 700, minWidth: 24 }}>{size}</span>
<button onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")} style={{ background: tool === "eraser" ? "var(--accent)" : "var(--card)", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
{tool === "eraser" ? "✏️ Pen" : "⬜ Eraser"}
</button>
<button onClick={undo_stroke} style={{ background: "var(--card)", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>↩ Undo</button>
<button onClick={clear_canvas} style={{ background: "#c0392b", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>🗑 Clear</button>
</div>
</div>
)}
</div>
);
}
