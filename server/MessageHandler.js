const { createGameSession, saveGameResult } = require("./db");
class MessageHandler {
constructor(io, rooms) {
this.io = io;
this.rooms = rooms;
}
handleCreateRoom(socket, { hostName, settings }) {
const { v4: uuidv4 } = require("uuid");
const Room = require("./Room");
const Player = require("./Player");
const roomId = uuidv4().slice(0, 6).toUpperCase();
const playerId = uuidv4();
const player = new Player(playerId, hostName, socket.id);
player.isReady = true;
const room = new Room(roomId, playerId, settings || {});
room.addPlayer(player);
this.rooms.set(roomId, room);
socket.join(roomId);
socket.emit("room_created", { roomId, playerId, player: player.toJSON(), players: room.getPlayers().map(p => p.toJSON()), settings: room.settings });
}
handleJoinRoom(socket, { roomId, playerName }) {
const { v4: uuidv4 } = require("uuid");
const Player = require("./Player");
const room = this.rooms.get(roomId);
if (!room) { socket.emit("error", { message: "Room not found" }); return; }
if (room.players.size >= (room.settings.maxPlayers || 10)) { socket.emit("error", { message: "Room is full" }); return; }
if (room.game.phase !== "waiting") { socket.emit("error", { message: "Game already in progress" }); return; }
const playerId = uuidv4();
const player = new Player(playerId, playerName, socket.id);
room.addPlayer(player);
socket.join(roomId);
socket.emit("room_joined", { roomId, playerId, player: player.toJSON(), players: room.getPlayers().map(p => p.toJSON()), settings: room.settings, hostId: room.hostId });
socket.to(roomId).emit("player_joined", { player: player.toJSON(), players: room.getPlayers().map(p => p.toJSON()) });
}
handleStartGame(socket, { roomId, playerId }) {
const { v4: uuidv4 } = require("uuid");
const room = this.rooms.get(roomId);
if (!room || room.hostId !== playerId) return;
if (room.players.size < 2) { socket.emit("error", { message: "Need at least 2 players" }); return; }
room.sessionId = uuidv4();
createGameSession(room.sessionId, roomId, room.settings);
room.game.currentRound = 1;
room.game.phase = "choosing";
this.startRound(room);
}
startRound(room) {
const players = room.getPlayers();
if (room.game.currentDrawerIndex >= players.length) {
room.game.currentDrawerIndex = 0;
room.game.currentRound++;
}
if (room.game.currentRound > room.game.rounds) {
this.endGame(room);
return;
}
players.forEach(p => p.reset());
room.canvasState = [];
const drawer = room.getDrawer();
if (!drawer) return;
const wordOptions = room.pickWordOptions();
room.game.wordOptions = wordOptions;
room.game.phase = "choosing";
room.game.currentWord = null;
room.game.revealedIndices = new Set();
this.io.to(room.id).emit("round_start", { round: room.game.currentRound, totalRounds: room.game.rounds, drawerId: drawer.id, drawerName: drawer.name, drawTime: room.game.drawTime });
const drawerSocket = this.getSocket(drawer.socketId);
if (drawerSocket) drawerSocket.emit("word_options", { words: wordOptions });
room.game.timer = setTimeout(() => {
if (!room.game.currentWord) {
room.game.currentWord = wordOptions[0];
this.beginDrawing(room);
}
}, 15000);
}
beginDrawing(room) {
room.game.phase = "drawing";
room.game.timeLeft = room.game.drawTime;
const word = room.game.currentWord;
const drawer = room.getDrawer();
const hintWord = room.game.getHintWord(word);
this.io.to(room.id).emit("game_state", { phase: "drawing", round: room.game.currentRound, totalRounds: room.game.rounds, drawerId: drawer ? drawer.id : null, hint: hintWord, timeLeft: room.game.drawTime, wordLength: word.length });
if (room.game.hints > 0) {
let hintCount = 0;
room.game.hintInterval = setInterval(() => {
hintCount++;
if (hintCount <= room.game.hints) {
room.game.revealNextHint(word);
const updated = room.game.getHintWord(word);
this.io.to(room.id).emit("hint_update", { hint: updated });
}
}, Math.floor((room.game.drawTime / (room.game.hints + 1)) * 1000));
}
room.game.timer = setTimeout(() => {
this.endRound(room, false);
}, room.game.drawTime * 1000);
}
handleWordChosen(socket, { roomId, playerId, word }) {
const room = this.rooms.get(roomId);
if (!room) return;
const drawer = room.getDrawer();
if (!drawer || drawer.id !== playerId) return;
if (room.game.currentWord) return;
clearTimeout(room.game.timer);
room.game.currentWord = word;
this.beginDrawing(room);
}
handleGuess(socket, { roomId, playerId, text }) {
const room = this.rooms.get(roomId);
if (!room || room.game.phase !== "drawing") return;
const player = room.getPlayer(playerId);
if (!player) return;
const drawer = room.getDrawer();
if (drawer && drawer.id === playerId) return;
if (player.hasGuessed) return;
const correct = text.trim().toLowerCase() === room.game.currentWord.trim().toLowerCase();
if (correct) {
player.hasGuessed = true;
const guessersCount = room.getPlayers().filter(p => p.hasGuessed).length;
const points = Math.max(50, Math.round((room.game.timeLeft / room.game.drawTime) * 100) + (10 - guessersCount) * 5);
player.addScore(points);
if (drawer) drawer.addScore(Math.round(points * 0.3));
this.io.to(room.id).emit("guess_result", { correct: true, playerId, playerName: player.name, points, players: room.getPlayers().map(p => p.toJSON()) });
const nonDrawers = room.getPlayers().filter(p => drawer ? p.id !== drawer.id : true);
const allGuessed = nonDrawers.every(p => p.hasGuessed);
if (allGuessed) this.endRound(room, true);
} else {
this.io.to(room.id).emit("chat_message", { playerId, playerName: player.name, text, isGuess: true });
}
}
handleChat(socket, { roomId, playerId, text }) {
const room = this.rooms.get(roomId);
if (!room) return;
const player = room.getPlayer(playerId);
if (!player) return;
this.io.to(room.id).emit("chat_message", { playerId, playerName: player.name, text, isGuess: false });
}
handleDrawStart(socket, { roomId, x, y, color, size }) {
const room = this.rooms.get(roomId);
if (!room) return;
const stroke = { type: "start", x, y, color, size };
room.canvasState.push(stroke);
socket.to(room.id).emit("draw_data", stroke);
}
handleDrawMove(socket, { roomId, x, y }) {
const room = this.rooms.get(roomId);
if (!room) return;
const stroke = { type: "move", x, y };
room.canvasState.push(stroke);
socket.to(room.id).emit("draw_data", stroke);
}
handleDrawEnd(socket, { roomId }) {
const room = this.rooms.get(roomId);
if (!room) return;
const stroke = { type: "end" };
room.canvasState.push(stroke);
socket.to(room.id).emit("draw_data", stroke);
}
handleCanvasClear(socket, { roomId, playerId }) {
const room = this.rooms.get(roomId);
if (!room) return;
const drawer = room.getDrawer();
if (!drawer || drawer.id !== playerId) return;
room.canvasState = [];
this.io.to(room.id).emit("canvas_cleared");
}
handleDrawUndo(socket, { roomId, playerId }) {
const room = this.rooms.get(roomId);
if (!room) return;
const drawer = room.getDrawer();
if (!drawer || drawer.id !== playerId) return;
let lastEnd = -1;
for (let i = room.canvasState.length - 1; i >= 0; i--) {
if (room.canvasState[i].type === "end") { lastEnd = i; break; }
}
if (lastEnd === -1) return;
let prevEnd = -1;
for (let i = lastEnd - 1; i >= 0; i--) {
if (room.canvasState[i].type === "end") { prevEnd = i; break; }
}
room.canvasState = room.canvasState.slice(0, prevEnd + 1);
this.io.to(room.id).emit("canvas_state", { strokes: room.canvasState });
}
handleRequestCanvas(socket, { roomId }) {
const room = this.rooms.get(roomId);
if (!room) return;
socket.emit("canvas_state", { strokes: room.canvasState });
}
endRound(room, allGuessed) {
room.game.clearTimers();
room.game.phase = "roundEnd";
const word = room.game.currentWord;
const players = room.getPlayers();
this.io.to(room.id).emit("round_end", { word, players: players.map(p => p.toJSON()) });
room.game.currentDrawerIndex++;
setTimeout(() => { this.startRound(room); }, 5000);
}
endGame(room) {
room.game.phase = "gameOver";
const players = room.getPlayers().sort((a, b) => b.score - a.score);
const winner = players[0];
if (room.sessionId) {
try {
saveGameResult(room.sessionId, players);
} catch (err) {
console.error("Failed to save game result:", err);
}
}
this.io.to(room.id).emit("game_over", { winner: winner ? winner.toJSON() : null, leaderboard: players.map(p => p.toJSON()) });
room.game.reset();
}
handleDisconnect(socket) {
for (const [roomId, room] of this.rooms.entries()) {
const player = room.getPlayerBySocketId(socket.id);
if (player) {
room.removePlayer(player.id);
this.io.to(roomId).emit("player_left", { playerId: player.id, players: room.getPlayers().map(p => p.toJSON()) });
if (room.players.size === 0) {
room.game.clearTimers();
this.rooms.delete(roomId);
} else if (room.hostId === player.id) {
const first = room.getPlayers()[0];
if (first) {
room.hostId = first.id;
this.io.to(roomId).emit("host_changed", { hostId: first.id });
}
}
break;
}
}
}
getSocket(socketId) {
return this.io.sockets.sockets.get(socketId);
}
}
module.exports = MessageHandler;