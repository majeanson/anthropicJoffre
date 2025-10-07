# Trick Card Game

A real-time trick card game with WebSocket support and PostgreSQL for historical data.

## Game Rules

- **Players**: 4 players in 2 teams
- **Cards**: 0-7 in four colors (red, brown, green, blue) = 32 cards
- **Special cards**: 0 red (+5 points), 0 brown (-2 points)

### Game Flow

1. **Team Selection**: Players form 2 teams
2. **Betting**: Players bet 7-12 tricks, with/without trump
3. **Card Playing**: Highest bidder starts, first card determines trump
4. **Scoring**: Meet bet = gain points, miss = lose points (doubled for no-trump)
5. **Win Condition**: First team to 41 points wins

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Vercel Postgres)

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure your database connection in `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3001
```

**For Vercel Postgres:**
- Go to your Vercel dashboard
- Navigate to Storage → Create Database → Postgres
- Copy the connection string and paste it in your `.env` file

4. Set up the database tables:
```bash
npm run db:setup
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure the backend URL in `.env`:
```
VITE_SOCKET_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

## How to Play

1. Open the app in your browser
2. Create a new game or join an existing game with the Game ID
3. Wait for 4 players to join (2 teams of 2)
4. **Betting Phase**: Each player bets how many tricks they think they'll win (7-12)
   - Optionally select "Without Trump" for double points
5. **Playing Phase**:
   - Highest bidder starts
   - First card played becomes trump for that round
   - Follow the leading suit if possible
   - Trump cards beat all other suits
6. **Scoring**:
   - Meet or exceed your bet: gain points equal to your bet
   - Miss your bet: lose points equal to your bet
   - "Without Trump" bets double the points (win or lose)
7. First team to reach 41 points wins!

## Special Cards

- **Red 0**: +5 points when won in a trick
- **Brown 0**: -2 points when won in a trick
