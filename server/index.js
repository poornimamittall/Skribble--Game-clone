const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const MessageHandler = require("./MessageHandler");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use(cors());
app.use(express.json());
const rooms = new Map();
const handler = new MessageHandler(io, rooms);
app.get("/rooms", (req, res) => {
const publicRooms = [];
for (const room of rooms.values()) {
if (!room.isPrivate && room.game.phase === "waiting") {
publicRooms.push(room.toPublicJSON());
}
}
res.json(publicRooms);
});
app.get("/health", (req, res) => res.json({ ok: true }));
io.on("connection", (socket) => {
socket.on("create_room", (data) => handler.handleCreateRoom(socket, data));
socket.on("join_room", (data) => handler.handleJoinRoom(socket, data));
socket.on("start_game", (data) => handler.handleStartGame(socket, data));
socket.on("word_chosen", (data) => handler.handleWordChosen(socket, data));
socket.on("guess", (data) => handler.handleGuess(socket, data));
socket.on("chat", (data) => handler.handleChat(socket, data));
socket.on("draw_start", (data) => handler.handleDrawStart(socket, data));
socket.on("draw_move", (data) => handler.handleDrawMove(socket, data));
socket.on("draw_end", (data) => handler.handleDrawEnd(socket, data));
socket.on("canvas_clear", (data) => handler.handleCanvasClear(socket, data));
socket.on("draw_undo", (data) => handler.handleDrawUndo(socket, data));
socket.on("request_canvas", (data) => handler.handleRequestCanvas(socket, data));
socket.on("disconnect", () => handler.handleDisconnect(socket));
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
