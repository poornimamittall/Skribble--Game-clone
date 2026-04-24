const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "skribble.db"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, total_score INTEGER DEFAULT 0, games_played INTEGER DEFAULT 0, wins INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS game_sessions (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, rounds INTEGER, word_count INTEGER, started_at DATETIME DEFAULT CURRENT_TIMESTAMP, ended_at DATETIME); CREATE TABLE IF NOT EXISTS game_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, player_id TEXT NOT NULL, player_name TEXT NOT NULL, score INTEGER DEFAULT 0, is_winner INTEGER DEFAULT 0, FOREIGN KEY(session_id) REFERENCES game_sessions(id));`);
function createGameSession(sessionId, roomId, settings) {
db.prepare(`INSERT OR IGNORE INTO game_sessions (id, room_id, rounds, word_count) VALUES (?, ?, ?, ?)`).run(sessionId, roomId, settings.rounds || 3, settings.wordCount || 3);
}
function saveGameResult(sessionId, players) {
db.prepare(`UPDATE game_sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);
const sorted = [...players].sort((a, b) => b.score - a.score);
const winnerId = sorted[0]?.id;
const insertScore = db.prepare(`INSERT INTO game_scores (session_id, player_id, player_name, score, is_winner) VALUES (?, ?, ?, ?, ?)`);
const upsertPlayer = db.prepare(`INSERT INTO players (id, name, total_score, games_played, wins) VALUES (?, ?, ?, 1, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, total_score = total_score + excluded.total_score, games_played = games_played + 1, wins = wins + excluded.wins`);
const saveAll = db.transaction(() => {
for (const player of players) {
const isWinner = player.id === winnerId ? 1 : 0;
insertScore.run(sessionId, player.id, player.name, player.score, isWinner);
upsertPlayer.run(player.id, player.name, player.score, isWinner);
}
});
saveAll();
}
function getLeaderboard(limit = 10) {
return db.prepare(`SELECT name, total_score, games_played, wins FROM players ORDER BY total_score DESC LIMIT ?`).all(limit);
}
function getPlayerStats(playerId) {
return db.prepare(`SELECT id, name, total_score, games_played, wins, created_at FROM players WHERE id = ?`).get(playerId);
}
function getRecentGames(limit = 5) {
return db.prepare(`SELECT gs.id, gs.room_id, gs.rounds, gs.started_at, gs.ended_at, sc.player_name, sc.score, sc.is_winner FROM game_sessions gs JOIN game_scores sc ON sc.session_id = gs.id WHERE gs.ended_at IS NOT NULL ORDER BY gs.ended_at DESC LIMIT ?`).all(limit);
}
module.exports = { db, createGameSession, saveGameResult, getLeaderboard, getPlayerStats, getRecentGames };