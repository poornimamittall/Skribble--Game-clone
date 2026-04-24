import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
let socket = null;
export function getSocket() {
if (!socket) socket = io(SERVER_URL);
return socket;
}
export function useSocket(handlers) {
const ref = useRef(handlers);
ref.current = handlers;
useEffect(() => {
const s = getSocket();
const entries = Object.entries(ref.current);
entries.forEach(([event, fn]) => s.on(event, fn));
return () => entries.forEach(([event, fn]) => s.off(event, fn));
}, []);
return getSocket();
}
