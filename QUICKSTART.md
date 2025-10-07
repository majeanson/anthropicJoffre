# Quick Start Guide

Get the trick card game running locally in 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL database (local or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))
- Git

## Setup Steps

### 1. Clone & Install (2 minutes)

```bash
git clone https://github.com/majeanson/anthropicJoffre.git
cd anthropicJoffre

# Install all dependencies
npm install
npm run install:all
```

### 2. Configure Environment (1 minute)

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/trickgame
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Setup Database (1 minute)

```bash
cd ../backend
npm run db:setup
```

You should see: `✅ Database tables created successfully!`

### 4. Run the App (1 minute)

From the root directory:
```bash
npm run dev
```

This starts both servers:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Play Locally

1. Open http://localhost:5173
2. Create a game
3. Open 3 more browser windows/tabs
4. Join with the Game ID
5. Play!

## Troubleshooting

**"Database connection failed"**
```bash
# Check your DATABASE_URL in backend/.env
# Make sure PostgreSQL is running
cd backend && npm run db:setup
```

**"Can't connect to backend"**
```bash
# Make sure backend is running on port 3001
# Check backend/.env has PORT=3001
# Check frontend/.env has VITE_SOCKET_URL=http://localhost:3001
```

**"npm install fails"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Using Vercel Postgres

1. Go to https://vercel.com/dashboard/storage
2. Create Postgres database
3. Copy connection string
4. Add to `backend/.env` as `DATABASE_URL`
5. Run `npm run db:setup`

## Next Steps

- [Deploy to production](RAILWAY_DEPLOY.md)
- [API documentation](README.md#-api-reference)
- [Game rules](README.md#-game-rules)
