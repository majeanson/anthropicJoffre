# Deploy to Vercel - Complete Guide

Deploy both frontend and backend to Vercel in under 15 minutes.

## ⚠️ Important Note About WebSockets on Vercel

Vercel Serverless Functions have a **maximum execution time**:
- **Hobby Plan**: 10 seconds
- **Pro Plan**: 60 seconds

This means WebSocket connections will disconnect after this time. For a production game, consider:
- Using Vercel for frontend + Railway/Render for backend
- Implementing automatic reconnection logic
- Upgrading to Vercel Pro

**For testing/POC**: Vercel works fine, just expect periodic reconnections.

## 📋 Deployment Steps

### Step 1: Set Up Vercel Postgres (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database**
3. Select **Postgres** → **Continue**
4. Database name: `trick-game-db`
5. Select region (choose closest to you)
6. Click **Create**
7. Go to the **Quickstart** tab
8. Copy the connection string from `.env.local` tab
9. It will look like: `postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb`

### Step 2: Deploy Backend to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `majeanson/anthropicJoffre`
4. Click **Import**

**Project Configuration:**
- **Project Name**: `trick-game-backend` (or your choice)
- **Framework Preset**: Other
- **Root Directory**: `backend` ⭐
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
Click **Add** and add these:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Vercel Postgres connection string |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Leave empty for now (will add after frontend) |

5. Click **Deploy**
6. Wait for deployment to complete
7. **Copy your backend URL** (e.g., `https://trick-game-backend.vercel.app`)

### Step 3: Set Up Database Schema (2 minutes)

Run from your local machine:

```bash
cd backend

# Make sure .env has your Vercel Postgres URL
echo "DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb" > .env

# Run setup
npm run db:setup
```

You should see: `✅ Database tables created successfully!`

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `majeanson/anthropicJoffre` (same repo)
4. Click **Import**

**Project Configuration:**
- **Project Name**: `trick-game` (or your choice)
- **Framework Preset**: Vite ⭐
- **Root Directory**: `frontend` ⭐
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
Click **Add** and add:

| Name | Value |
|------|-------|
| `VITE_SOCKET_URL` | Your backend URL from Step 2 |

Example:
```
VITE_SOCKET_URL=https://trick-game-backend.vercel.app
```

5. Click **Deploy**
6. Wait for deployment to complete
7. **Copy your frontend URL** (e.g., `https://trick-game.vercel.app`)

### Step 5: Update Backend with Frontend URL (2 minutes)

1. Go to your backend project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Find `CLIENT_URL` and click **Edit**
4. Set value to your frontend URL: `https://trick-game.vercel.app`
5. Click **Save**
6. Go to **Deployments** tab
7. Click the three dots on the latest deployment
8. Click **Redeploy**

## ✅ Test Your Deployment

1. Open your frontend URL: `https://trick-game.vercel.app`
2. Click **Create Game**
3. Enter your name
4. Copy the Game ID
5. Open in incognito/private window
6. Click **Join Game**
7. Paste Game ID and enter a different name
8. Repeat for 4 total players
9. Play the game!

## 🔧 Troubleshooting

### Frontend shows "Can't connect to server"

**Check:**
1. Backend is deployed and running
2. `VITE_SOCKET_URL` environment variable is correct
3. No typos in the URL (should start with `https://`)

**Fix:**
```bash
# In Vercel dashboard:
Frontend Project → Settings → Environment Variables → Edit VITE_SOCKET_URL
```

### "CORS error" in browser console

**Check:**
1. `CLIENT_URL` is set in backend
2. It matches your frontend URL exactly

**Fix:**
```bash
# In Vercel dashboard:
Backend Project → Settings → Environment Variables → Edit CLIENT_URL
# Set to: https://your-frontend.vercel.app
# Redeploy backend
```

### Players disconnect after 10-60 seconds

This is expected on Vercel due to serverless function timeouts.

**Solutions:**
1. **Upgrade to Vercel Pro** (60s timeout instead of 10s)
2. **Add reconnection logic** (we can implement this)
3. **Use Railway for backend** (no timeout limits)

### Database connection errors

**Check:**
1. `DATABASE_URL` is correct in backend
2. Database schema is set up (`npm run db:setup`)

**Fix:**
```bash
cd backend
# Update .env with correct Vercel Postgres URL
npm run db:setup
```

## 📊 View Your Deployments

**Frontend:** https://vercel.com/dashboard (find your frontend project)
**Backend:** https://vercel.com/dashboard (find your backend project)
**Database:** https://vercel.com/dashboard/storage

### Check Logs
1. Go to project in Vercel
2. Click **Deployments**
3. Click on a deployment
4. Click **Runtime Logs**

### Check Database
1. Go to Vercel Dashboard → Storage
2. Click your Postgres database
3. Click **Data** tab to view tables
4. Click **Query** to run SQL

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Production**: Push to `main` branch
- **Preview**: Push to any other branch or create PR

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel will automatically deploy!
```

## 💰 Costs

**Free Tier (Hobby):**
- Frontend: Free
- Backend: Free (with 10s timeout)
- Database: Free tier (~5GB storage)

**Pro Tier ($20/month):**
- Frontend: Unlimited
- Backend: 60s timeout (better for WebSockets)
- Database: Included

## 🚀 Add Reconnection Logic

To handle Vercel timeouts, add this to `frontend/src/App.tsx`:

```typescript
// In the useEffect where socket is created:
newSocket.on('disconnect', () => {
  console.log('Disconnected, attempting to reconnect...');
  setTimeout(() => {
    newSocket.connect();
  }, 1000);
});

newSocket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

This will automatically reconnect if the connection drops.

## 📝 Environment Variables Summary

**Backend:**
```env
DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb
PORT=3001
NODE_ENV=production
CLIENT_URL=https://trick-game.vercel.app
```

**Frontend:**
```env
VITE_SOCKET_URL=https://trick-game-backend.vercel.app
```

## 🎯 Next Steps After Deployment

1. **Test thoroughly** - Play a full game with 4 players
2. **Monitor** - Check logs for errors
3. **Share** - Send the URL to friends
4. **Iterate** - Add features based on feedback

## 🆘 Need Help?

- Check Vercel docs: https://vercel.com/docs
- Check project README.md
- Check QUICKSTART.md for local development
- Open GitHub issue: https://github.com/majeanson/anthropicJoffre/issues
