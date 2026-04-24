const Game = require("./Game");
const wordData = require("./words");
class Room {
constructor(id, hostId, settings) {
this.id = id;
this.hostId = hostId;
this.settings = settings;
this.players = new Map();
this.game = new Game(settings);
this.strokes = [];
this.isPrivate = settings.isPrivate || false;
this.canvasState = [];
}
addPlayer(player) {
this.players.set(player.id, player);
}
removePlayer(playerId) {
this.players.delete(playerId);
}
getPlayer(id) {
return this.players.get(id);
}
getPlayerBySocketId(socketId) {
for (const p of this.players.values()) {
if (p.socketId === socketId) return p;
}
return null;
}
getPlayers() {
return Array.from(this.players.values());
}
getDrawer() {
const players = this.getPlayers();
return players[this.game.currentDrawerIndex] || null;
}
pickWordOptions() {
const allWords = Object.values(wordData).flat();
const shuffled = allWords.sort(() => Math.random() - 0.5);
return shuffled.slice(0, this.settings.wordCount || 3);
}
broadcast(io, event, data) {
io.to(this.id).emit(event, data);
}
toPublicJSON() {
return {
id: this.id,
playerCount: this.players.size,
maxPlayers: this.settings.maxPlayers,
rounds: this.settings.rounds,
isPrivate: this.isPrivate,
phase: this.game.phase
};
}
}
module.exports = Room;
