# Local Development Without Neon

To avoid hitting Neon's compute quota during development and testing, use a local PostgreSQL database.

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Setup

1. **Start local PostgreSQL database:**
   ```bash
   npm run db:local
   ```
   This starts a Postgres container on port 5432 with auto-initialization.

2. **Start development servers with local DB:**
   ```bash
   npm run dev:local
   ```
   This starts the local DB + backend + frontend all together.

3. **Run tests against local DB:**
   ```bash
   npm run test:all
   ```

### Database Management Commands

```bash
npm run db:local           # Start local database
npm run db:local:stop      # Stop local database
npm run db:local:logs      # View database logs
npm run db:local:reset     # Reset database (delete all data and restart)
```

### How It Works

- Docker Compose starts PostgreSQL 15 in a container
- Data persists in a Docker volume (`postgres_data`)
- Schema auto-initializes on first run from `backend/src/db/schema.sql`
- Backend uses `.env.local` which points to `localhost:5432`

### Connection String

**Local:** `postgresql://postgres:postgres@localhost:5432/trickgame`
**Neon (Production):** Set in `.env` (not committed)

---

## 🛠️ Alternative: Manual PostgreSQL Installation

If you don't want to use Docker:

### Windows
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Install with default settings (user: postgres, password: postgres)
3. Create database: `createdb -U postgres trickgame`
4. Run schema: `psql -U postgres -d trickgame -f backend/src/db/schema.sql`

### Mac (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb trickgame
psql -d trickgame -f backend/src/db/schema.sql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb trickgame
sudo -u postgres psql -d trickgame -f backend/src/db/schema.sql
```

---

## 🔄 Switching Between Local and Neon

### Use Local Database
The backend checks for `.env.local` first, then falls back to `.env`.

**backend/.env.local** (already created):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame
```

### Use Neon Database
Just delete or rename `.env.local` and the backend will use `.env` with your Neon connection string.

---

## ✅ Benefits of Local Development

- **Zero Neon compute usage** during development
- **Faster database queries** (no network latency)
- **Unlimited testing** without quota concerns
- **Works offline**
- **Easy to reset/debug** (`npm run db:local:reset`)

---

## 🚨 Important Notes

- `.env.local` is in `.gitignore` and won't be committed
- Production still uses Neon via Railway environment variables
- Local DB data persists in Docker volume (won't be lost on restart)
- Use `docker-compose down -v` to delete all local data

---

## 📊 Current Setup

Your current servers (already running) are using **Neon** because they were started before `.env.local` was created.

### To switch to local DB NOW:

1. Stop current backend server (Ctrl+C or kill the process)
2. Start local database: `npm run db:local`
3. Restart backend: `npm run dev:backend`

The backend will now connect to your local PostgreSQL instead of Neon!
