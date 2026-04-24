import React, { useState, useEffect, useRef } from "react";
export default function Timer({ initialTime, onEnd }) {
const [time, setTime] = useState(initialTime);
const ref = useRef(initialTime);
ref.current = time;
useEffect(() => {
setTime(initialTime);
const t = setInterval(() => {
setTime(p => {
if (p <= 1) { clearInterval(t); if (onEnd) onEnd(); return 0; }
return p - 1;
});
}, 1000);
return () => clearInterval(t);
}, [initialTime]);
const pct = (time / initialTime) * 100;
const col = time > initialTime * 0.5 ? "#4caf50" : time > initialTime * 0.25 ? "#ff9800" : "#e74c3c";
return (
<div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
<div style={{ width: 44, height: 44, borderRadius: "50%", background: `conic-gradient(${col} ${pct * 3.6}deg, var(--card) 0)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
<div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: col }}>
{time}
</div>
</div>
</div>
);
}
