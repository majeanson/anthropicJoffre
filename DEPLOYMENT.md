# Deployment Guide - Vercel

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- Git repository pushed to GitHub/GitLab/Bitbucket

## Step 1: Set Up Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database**
3. Select **Postgres** → **Continue**
4. Choose a name (e.g., `trick-card-game-db`)
5. Select region closest to your users
6. Click **Create**
7. **Copy the connection string** (you'll need this for the backend)

## Step 2: Deploy Backend

### Option A: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your Git repository
4. **Configure Project:**
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables:**
   - Click **Environment Variables**
   - Add the following:
     - `DATABASE_URL` = Your Vercel Postgres connection string
     - `PORT` = `3001`
     - `NODE_ENV` = `production`
     - `CLIENT_URL` = (Leave empty for now, will add after frontend deployment)

6. Click **Deploy**
7. **Copy the deployment URL** (e.g., `https://your-backend.vercel.app`)

### Option B: Via CLI

```bash
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables when asked

# For production deployment
vercel --prod
```

### Set Up Database Schema

After backend is deployed, run the database setup:

```bash
# Install dependencies
cd backend
npm install

# Create .env with your Vercel Postgres URL
echo "DATABASE_URL=your_vercel_postgres_url" > .env

# Run setup script
npm run db:setup
```

Or run the SQL directly in Vercel:
1. Go to Vercel Dashboard → Storage → Your Postgres DB
2. Click **Query**
3. Copy and paste contents of `backend/src/db/schema.sql`
4. Click **Run**

## Step 3: Deploy Frontend

### Option A: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import the same Git repository (or add a new project)
4. **Configure Project:**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables:**
   - Click **Environment Variables**
   - Add:
     - `VITE_SOCKET_URL` = Your backend URL (from Step 2)

6. Click **Deploy**
7. **Copy the deployment URL** (e.g., `https://your-game.vercel.app`)

### Option B: Via CLI

```bash
cd frontend

# Deploy
vercel

# Set environment variable
vercel env add VITE_SOCKET_URL

# For production
vercel --prod
```

## Step 4: Update Backend CORS

1. Go to backend project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add/Update `CLIENT_URL` with your frontend URL
4. Redeploy the backend

Or update `backend/src/index.ts` to include your frontend URL in CORS settings.

## Step 5: Redeploy Backend with Frontend URL

1. Go to backend project in Vercel
2. Click **Deployments**
3. Click the three dots on the latest deployment
4. Click **Redeploy**

## Testing Your Deployment

1. Visit your frontend URL: `https://your-game.vercel.app`
2. Create a game
3. Open in another browser/incognito window
4. Join the game with the Game ID
5. Test the full game flow

## Important Notes

### WebSocket Limitations on Vercel

⚠️ **Vercel Serverless Functions have limitations with WebSockets:**
- Connections timeout after 60 seconds (or 15 seconds on Hobby plan)
- Not ideal for long-running connections

**Recommended alternatives for production:**
1. **Railway.app** - Better WebSocket support, easy deployment
2. **Render.com** - Free tier with good WebSocket support
3. **Fly.io** - Excellent for real-time apps
4. **DigitalOcean App Platform** - Good balance of features

### Alternative: Deploy Backend to Railway

If you experience WebSocket issues on Vercel:

1. Go to [Railway.app](https://railway.app)
2. Sign up and create new project
3. Click **Deploy from GitHub**
4. Select your repository
5. Choose `backend` as root directory
6. Add environment variables (DATABASE_URL, PORT, CLIENT_URL)
7. Railway will auto-detect and deploy
8. Update frontend `VITE_SOCKET_URL` to Railway URL
9. Redeploy frontend

## Continuous Deployment

Once set up, Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_SOCKET_URL` environment variable
- Verify backend is deployed and running
- Check browser console for CORS errors

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database schema is set up
- Test connection using a tool like `psql` or Vercel's query interface

### WebSocket disconnects frequently
- This is expected on Vercel free tier
- Consider using Railway/Render for backend
- Or implement reconnection logic in frontend

## Cost Estimates

**Vercel:**
- Frontend: Free (Hobby tier)
- Backend: Free tier available, but limited for WebSockets
- Database: ~$10/month for Postgres

**Railway (recommended for backend):**
- $5 free credit monthly
- Pay for what you use after that
- Better WebSocket support

## Environment Variables Summary

**Backend:**
```
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
```

**Frontend:**
```
VITE_SOCKET_URL=https://your-backend.railway.app
```
