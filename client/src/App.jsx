import React, { useState } from "react";
import Home from "./pages/home";
import Lobby from "./pages/lobby";
import Game from "./pages/game";
import GameOver from "./pages/gameover";
export default function App() {
const [screen, setScreen] = useState("home");
const [roomData, setRoomData] = useState(null);
const [roundData, setRoundData] = useState(null);
const [gameOverData, setGameOverData] = useState(null);
const handle_joined = (data) => {
setRoomData(data);
setScreen("lobby");
};
const handle_game_start = (data) => {
setRoundData(data);
setScreen("game");
};
const handle_game_over = (data) => {
setGameOverData(data);
setScreen("gameover");
};
const handle_play_again = () => {
setScreen("home");
setRoomData(null);
setRoundData(null);
setGameOverData(null);
};
if (screen === "home") return <Home onJoined={handle_joined} />;
if (screen === "lobby") return <Lobby roomData={roomData} onGameStart={handle_game_start} onPlayerUpdate={(p) => setRoomData(d => ({...d, players: p}))} />;
if (screen === "game") return <Game roomData={roomData} roundData={roundData} onGameOver={handle_game_over} />;
if (screen === "gameover") return <GameOver data={gameOverData} onPlayAgain={handle_play_again} />;
return null;
}
