# Trick Card Game 🎮

A real-time multiplayer trick-taking card game built with React, Node.js, Socket.io, and PostgreSQL.

## 🎯 Features

### Core Gameplay
- **Real-time multiplayer** - 4 players, 2 teams, live WebSocket gameplay
- **Team-based strategy** - Cooperative betting and trick-taking
- **Special cards** - Red 0 (+5 points), Brown 0 (-2 points)
- **No-trump betting** - Double or nothing gameplay
- **Reconnection support** - 15-minute grace period with catch-up modal

### Social & Multiplayer
- **Spectator mode** - Watch ongoing games without playing
- **In-game chat** - Team selection and gameplay chat with emoji reactions
- **Lobby browser** - Browse and join public games
- **Quick share links** - One-click shareable game URLs
- **Rematch system** - Vote to play again with same players

### Stats & Progression
- **Global leaderboard** - Top 100 players worldwide
- **Player statistics** - Win rates, games played, performance metrics
- **Tier badges** - Bronze → Silver → Gold → Platinum → Diamond
- **Round history** - Detailed stats for every round
- **Game persistence** - PostgreSQL database with incremental saves

### AI & Testing
- **Bot players** - 3 difficulty levels (Easy/Medium/Hard)
- **Quick Play** - Instant 1v3 bot games
- **Autoplay mode** - Let AI play for you
- **4-player debug view** - Test all perspectives simultaneously

### UI/UX
- **Dark mode** - WCAG-compliant accessibility
- **Sound effects** - Web Audio API synthesized sounds
- **Mobile responsive** - Touch-friendly design
- **Timeout indicators** - 60s countdown with auto-play
- **How To Play modal** - In-app rules and tutorial

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/majeanson/anthropicJoffre.git
cd anthropicJoffre

# Install all dependencies
npm install
npm run install:all

# Set up environment variables
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# Set up database (add your DATABASE_URL to backend/.env first)
cd ../backend && npm run db:setup

# Run both servers
cd .. && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

**See [QUICKSTART.md](QUICKSTART.md) for detailed local setup**

### Deploy to Production

**See [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) for full deployment guide**

Quick deploy:
1. Deploy backend to Railway (WebSocket-optimized, no timeouts)
2. Deploy frontend to Vercel (free, fast CDN)
3. Connect with Vercel Postgres

Cost: ~$5-10/month

## 📖 Game Rules

### Setup
- **4 players** form 2 teams (Team 1 vs Team 2)
- **32 cards**: Values 0-7 in 4 colors (Red, Brown, Green, Blue)
- **8 cards** dealt to each player per round

### Phases

**1. Betting Phase**
- Each player bets 7-12 tricks they'll win
- Optional: Bet "without trump" for 2x points
- Highest bidder starts the round

**2. Playing Phase**
- First card played determines trump suit
- Must follow suit if possible
- Trump cards beat all other suits
- Highest card of leading/trump suit wins trick

**3. Scoring**
- Met bet: **+bet points**
- Missed bet: **-bet points**
- No-trump: Points **x2**
- Special cards add bonus points when won

**4. Win Condition**
- First team to **41 points** wins!

## 🏗️ Project Structure

```
anthropicJoffre/
├── backend/              # Node.js + Socket.io server
│   ├── src/
│   │   ├── db/          # PostgreSQL queries & schema
│   │   ├── game/        # Game logic & card handling
│   │   ├── types/       # TypeScript definitions
│   │   └── index.ts     # Main server & Socket.io handlers
│   └── package.json
│
├── frontend/            # React + Vite client
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── types/       # TypeScript definitions
│   │   └── App.tsx      # Main app & Socket.io client
│   └── package.json
│
├── README.md           # This file
├── QUICKSTART.md       # Local development guide
└── RAILWAY_DEPLOY.md   # Production deployment guide
```

## 🛠️ Tech Stack

**Backend**
- Node.js + TypeScript
- Express.js
- Socket.io (WebSockets)
- PostgreSQL (pg)
- Jest (testing)

**Frontend**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.io-client

**Deployment**
- Railway (backend)
- Vercel (frontend + database)

## 🎮 How to Play

### Create a Game
1. Visit the frontend URL
2. Click "Create Game"
3. Share the Game ID with 3 friends

### Join a Game
1. Get Game ID from host
2. Click "Join Game"
3. Enter Game ID and your name

### Gameplay
1. **Wait** for 4 players to join
2. **Bet** your tricks (7-12)
3. **Play** your cards strategically
4. **Win** tricks to meet your bet
5. First team to 41 points wins!

## 🔧 Development

### Run Tests
```bash
cd backend
npm test
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Variables

**Backend** (`.env`)
```env
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend** (`.env`)
```env
VITE_SOCKET_URL=http://localhost:3001
```

## 📝 API Reference

### REST Endpoints
- `GET /` - Server info
- `GET /api/health` - Health check
- `GET /api/games/lobby` - Browse public games
- `GET /api/stats/:playerName` - Get player statistics
- `GET /api/leaderboard` - Global top 100 players
- `GET /api/player-history/:playerName` - Player game history

### Socket.io Events

**Client → Server**
- `create_game` - Create new game
- `join_game` - Join existing game
- `spectate_game` - Watch game as spectator
- `place_bet` - Submit bet
- `play_card` - Play a card
- `send_game_chat` - Send in-game chat message
- `vote_rematch` - Vote for rematch
- `kick_player` - Kick AFK player (host only)
- `reconnect_to_game` - Reconnect after disconnect

**Server → Client**
- `game_created` - Game created successfully
- `player_joined` - Player joined game
- `round_started` - New round begins
- `game_updated` - Game state changed
- `trick_resolved` - Trick winner determined
- `round_ended` - Round complete
- `game_over` - Game finished
- `game_chat` - Chat message received
- `rematch_vote_update` - Rematch vote status
- `player_stats` - Player statistics
- `leaderboard` - Leaderboard data
- `online_players` - Online player list
- `player_reconnected` - Player reconnected
- `player_disconnected` - Player disconnected

## 🤝 Contributing

Contributions welcome! To add features:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development tips:**
- Backend tests: `cd backend && npm test`
- Type safety: Both projects use TypeScript strict mode
- Code style: Keep components small and focused. Prefer none comments and good nomenclature.
- Socket events: Add new events to types first

## 📄 License

MIT License - feel free to use this project however you like!

## 🆘 Troubleshooting

**Can't connect to server**
- Check backend is running on correct port
- Verify `VITE_SOCKET_URL` matches backend URL
- Check browser console for errors

**Database errors**
- Verify `DATABASE_URL` is set
- Run `npm run db:setup` to create tables
- Check Postgres is accessible

**Players disconnecting**
- If using Vercel for backend, use Railway instead (no WebSocket timeouts)
- Check Railway logs for errors

**Build fails**
- Delete `node_modules` and reinstall
- Check Node.js version (18+ required)
- Run `npm run build` locally first

---

Built with ❤️ using Claude Code
