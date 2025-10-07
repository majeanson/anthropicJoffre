# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

From the root directory:
```bash
npm install
npm run install:all
```

Or install manually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**
```bash
# Make sure PostgreSQL is running
cd backend
cp .env.example .env
# Edit .env with your local database URL
npm run db:setup
```

**Option B: Vercel Postgres**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the connection string
4. Create `backend/.env` and add:
   ```
   DATABASE_URL=your_vercel_connection_string
   PORT=3001
   ```
5. Run setup:
   ```bash
   cd backend
   npm run db:setup
   ```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if needed (default is http://localhost:3001)
```

### 4. Start Development Servers

**Option A: Run both servers at once (from root)**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Play!

1. Open browser to `http://localhost:5173`
2. Create a game and share the Game ID with 3 friends
3. Each player should join with the Game ID
4. Start playing!

## 🧪 Run Tests

```bash
cd backend
npm test
```

## 📝 Game Rules Summary

- **Players**: 4 players, 2 teams
- **Cards**: 0-7 in Red, Brown, Green, Blue (32 cards total)
- **Phases**: Betting → Playing → Scoring → Repeat
- **Betting**: Bet 7-12 tricks, optionally "without trump" for 2x points
- **Trump**: First card played determines trump for the round
- **Winning**: First team to 41 points wins

## 🐛 Troubleshooting

**Database connection error:**
- Check your `DATABASE_URL` in `backend/.env`
- Make sure PostgreSQL is running
- Run `npm run db:setup` again

**Socket connection error:**
- Check backend is running on port 3001
- Check `VITE_SOCKET_URL` in `frontend/.env`
- Check for firewall/antivirus blocking

**Cards not displaying:**
- Make sure all dependencies are installed
- Try clearing browser cache
- Check browser console for errors
