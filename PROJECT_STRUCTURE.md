# Project Structure

```
anthropicJoffre/
├── backend/                    # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── db/                # Database layer
│   │   │   ├── index.ts       # PostgreSQL client & queries
│   │   │   ├── schema.sql     # Database schema
│   │   │   └── setup.ts       # Database setup script
│   │   ├── game/              # Game logic
│   │   │   ├── deck.ts        # Card deck utilities
│   │   │   ├── deck.test.ts   # Deck tests
│   │   │   ├── logic.ts       # Game rules & scoring
│   │   │   └── logic.test.ts  # Logic tests
│   │   ├── types/
│   │   │   └── game.ts        # TypeScript types
│   │   └── index.ts           # Main server & Socket.io handlers
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # React + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Card.tsx       # Card display component
│   │   │   ├── Lobby.tsx      # Game lobby UI
│   │   │   ├── BettingPhase.tsx   # Betting phase UI
│   │   │   └── PlayingPhase.tsx   # Playing phase UI
│   │   ├── types/
│   │   │   └── game.ts        # TypeScript types (shared with backend)
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── package.json               # Root package.json for scripts
├── README.md                  # Main documentation
├── QUICKSTART.md             # Quick start guide
└── .gitignore
```

## Key Files

### Backend

- **`src/index.ts`**: Main server file with Socket.io event handlers
- **`src/game/logic.ts`**: Core game logic (trick resolution, scoring)
- **`src/game/deck.ts`**: Card deck creation and shuffling
- **`src/db/index.ts`**: PostgreSQL queries for game history
- **`src/db/schema.sql`**: Database table definitions

### Frontend

- **`src/App.tsx`**: Main app with Socket.io client and game state
- **`src/components/PlayingPhase.tsx`**: Main game UI (cards, tricks, scores)
- **`src/components/BettingPhase.tsx`**: Betting UI
- **`src/components/Lobby.tsx`**: Game creation/joining UI
- **`src/components/Card.tsx`**: Reusable card component

### Shared

- **`*/types/game.ts`**: TypeScript interfaces for game state (duplicated in both projects)

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Server**: Express.js
- **WebSockets**: Socket.io
- **Database**: PostgreSQL with pg client
- **Testing**: Jest + ts-jest
- **Dev Tools**: tsx (TypeScript execution)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **WebSockets**: Socket.io-client
- **Testing**: Vitest

## Data Flow

1. **Player joins** → Frontend emits `join_game` → Backend adds player to game state
2. **Game starts** → Backend deals cards → Emits `round_started` to all players
3. **Betting** → Players emit `place_bet` → Backend collects bets → Starts playing phase
4. **Playing** → Current player emits `play_card` → Backend validates → Updates trick
5. **Trick complete** → Backend resolves winner → Emits `trick_resolved`
6. **Round complete** → Backend calculates scores → Emits `round_ended`
7. **Game over** → Backend saves to database → Emits `game_over`

## State Management

- **Backend**: In-memory Map (can be migrated to Redis for production)
- **Frontend**: React useState with Socket.io event listeners
- **Database**: PostgreSQL for historical game data only
