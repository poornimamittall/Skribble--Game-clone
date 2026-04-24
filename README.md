# Skribble

A real-time multiplayer drawing and guessing game — basically Pictionary in a browser. One person draws, everyone else tries to guess the word. Points go to the guesser (faster = more points) and the drawer gets a cut too.

Built with React on the front, Node + Socket.IO on the back, and SQLite to keep a running record of game history and player stats.


---

## What it does

- Create a room or join one with a 6-character code
- Browse public rooms that haven't started yet
- Share a direct invite link (the room code gets appended to the URL automatically)
- The host configures rounds, draw time, number of word choices, and how many hints drop during a round
- Rooms can be set to private so they don't show up in the browser
- During a round, the drawer picks from 3 words (configurable), then draws on a shared canvas
- Everyone else guesses via chat — correct guesses are hidden from others so they can't piggyback
- Hints reveal random letters in the word at timed intervals
- The canvas supports undo, clear, pen color, and brush size
- Late joiners get the full canvas replayed so they're not staring at a blank screen
- After all rounds, a leaderboard shows final scores and the winner
- Every completed game gets saved to SQLite — player scores, wins, and session info

---

## Project layout

```
Skribble-Game/
├── server/
│   ├── index.js           # Express server + Socket.IO setup, REST endpoints
│   ├── MessageHandler.js  # All socket event logic lives here
│   ├── Room.js            # Room class — holds players, canvas state, settings
│   ├── Game.js            # Game state — phase, timers, hint logic, round tracking
│   ├── Player.js          # Player class — score, guess state, socket binding
│   ├── db.js              # SQLite setup via better-sqlite3, all DB functions
│   └── words.js           # Word bank split into 5 categories (100 words total)
└── client/
    ├── src/
    │   ├── App.jsx              # Top-level screen router (home → lobby → game → gameover)
    │   ├── pages/
    │   │   ├── home.jsx         # Create/join/browse rooms, room settings UI
    │   │   ├── lobby.jsx        # Waiting room, player list, start button for host
    │   │   ├── game.jsx         # Main game screen, wires everything together
    │   │   └── gameover.jsx     # Final leaderboard + play again
    │   ├── components/
    │   │   ├── canvas.jsx       # Drawing canvas with tool controls, handles both drawer and viewer
    │   │   ├── chat.jsx         # Chat + guess input, shows correct guesses differently
    │   │   ├── playerlist.jsx   # Live player list with scores and guess indicators
    │   │   ├── timer.jsx        # Countdown display
    │   │   └── wordpicker.jsx   # Word selection overlay for the drawer
    │   └── hooks/
    │       └── usesocket.js     # Singleton socket instance, shared across components
    └── vite.config.js
```

---

## How the game works internally

### Game phases

The server owns all game state. Clients never modify it directly — they just send events and react to what the server broadcasts.

```
waiting → choosing → drawing → roundEnd → (next drawer) → ... → gameOver
```

Each phase transition is server-triggered. If a drawer doesn't pick a word within 15 seconds, the server picks the first option automatically and moves on.

### Scoring

Points for a correct guess are calculated as:

```
points = max(50, round((timeLeft / drawTime) * 100) + (10 - guessPosition) * 5)
```

So guessing early and guessing before others earns more. The drawer gets 30% of each correct guesser's points. If everyone guesses correctly, the round ends early.

### Drawing sync

1. Mouse/touch events on the canvas fire `draw_start`, `draw_move`, `draw_end`
2. Each event goes to the server, which stores it in `room.canvasState` and rebroadcasts to everyone else in the room
3. The canvas renders using the native Canvas 2D API — strokes are replayed in order
4. Undo works by walking backward through `canvasState` to find the last completed stroke (bounded by `draw_end` events) and removing it, then broadcasting the trimmed state to all clients
5. When someone joins mid-game, they emit `request_canvas` and get the full stroke history to replay

### Hints

The hint system progressively reveals letters in the word. The server tracks which character indices have been revealed in a `Set`, and at regular intervals (based on `drawTime / (hints + 1)`), a random unrevealed non-space character gets added. Clients see underscores for hidden letters.

### Database

Three tables:

- `players` — cumulative stats per player (total score, games played, wins)
- `game_sessions` — one row per completed game with start/end times
- `game_scores` — each player's score for each session, with a winner flag

Player identity is UUID-based and stored client-side. Stats accumulate across games as long as the same player ID is used.

---

## Running locally

**Server** (runs on port 3001):

```bash
cd server
npm install
npm run dev
```

**Client** (runs on port 5173):

```bash
cd client
npm install
npm run dev
```

Then open two browser tabs and create + join a room to test it. You need at least 2 players to start a game.

The client picks up the server URL from `VITE_SERVER_URL`. Copy `.env.example` to `.env` if you need to change it:

```bash
cp client/.env.example client/.env
```

Default points to `http://localhost:3001`, which is fine for local dev.

---

## Deployment

WebSockets need a host that supports persistent connections — standard serverless platforms (Vercel functions, Netlify) won't work for the backend.

### Option A — Render (easiest)

**Backend:**
1. New → Web Service, connect repo, set root to `server`
2. Build: `npm install` | Start: `node index.js`
3. Copy the deployed URL

**Frontend:**
1. New → Static Site, root `client`
2. Build: `npm install && npm run build` | Publish: `dist`
3. Add env var: `VITE_SERVER_URL=https://your-server.onrender.com`

### Option B — Railway

Create two services pointing at `/server` and `/client`. Set `VITE_SERVER_URL` on the client service. Railway handles WebSockets natively and auto-detects Node.

### Option C — Vercel (frontend) + Render (backend)

Deploy `server/` to Render first, grab the URL, then deploy `client/` to Vercel and add `VITE_SERVER_URL` in the Vercel environment variables dashboard.

---

## Tech stack

| Layer | What's used |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Real-time | Socket.IO 4 |
| Database | SQLite via better-sqlite3 |
| IDs | uuid v4 |

---

## Word bank

100 words across 5 categories: `animals`, `objects`, `food`, `actions`, `places`. Each round picks randomly from the combined pool. To add more words, edit `server/words.js` — just add strings to the relevant array.

---

## Known limitations / things to improve

- Player identity is stored in memory on the client — refreshing the page during a game will drop you from the room
- No reconnection handling; if you disconnect mid-game you're out
- The SQLite file (`skribble.db`) lives on the server's filesystem, so it won't persist on platforms that reset the disk between deploys (Render free tier, for example) — use a volume mount or swap to a hosted DB if persistence matters
- No mobile-optimized layout yet, though touch drawing does work