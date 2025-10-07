# Production Deployment Guide

Deploy the trick card game to production using Railway (backend) + Vercel (frontend).

**Why this setup?**
- ✅ No WebSocket timeout issues
- ✅ Production-ready real-time connections
- ✅ ~$5-10/month total cost
- ✅ Auto-deploy from GitHub

## Deploy in 20 Minutes

### Step 1: Setup Database (5 min)

1. Go to https://vercel.com/dashboard/storage
2. Click **Create Database** → **Postgres**
3. Name: `trick-game-db`, select your region
4. Click **Create**
5. Go to **Quickstart** tab → Copy the `DATABASE_URL` from `.env.local`
6. Keep this tab open!

### Step 2: Initialize Database (2 min)

From your local machine:

```bash
cd backend
echo "DATABASE_URL=<paste_your_url_here>" > .env
npm run db:setup
```

You should see: `✅ Database tables created successfully!`

### Step 3: Deploy Backend to Railway (7 min)

1. Go to https://railway.app
2. **Login** with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select `majeanson/anthropicJoffre`
5. Click service → **Settings** tab
6. Set **Root Directory**: `backend`
7. Click **Variables** tab, add:
   - `DATABASE_URL`: Your Vercel Postgres URL
   - `NODE_ENV`: `production`
8. Click **Settings** → **Networking** → **Generate Domain**
9. **Copy your Railway URL** (e.g., `https://anthropicjoffre-production.up.railway.app`)

### Step 4: Deploy Frontend to Vercel (5 min)

1. Go to https://vercel.com/new
2. Import `majeanson/anthropicJoffre`
3. **Configure:**
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Leave other settings as default
4. **Environment Variables**, add:
   - `VITE_SOCKET_URL`: Your Railway URL from Step 3
5. Click **Deploy**
6. **Copy your Vercel URL** (e.g., `https://anthropic-joffre.vercel.app`)

### Step 5: Link Backend to Frontend (1 min)

1. Go back to **Railway** → Your service → **Variables**
2. Add:
   - `CLIENT_URL`: Your Vercel URL from Step 4 (no trailing slash!)
3. Railway will auto-redeploy

## ✅ Test Your Deployment

1. Visit your Vercel URL
2. Create a game
3. Share Game ID with 3 friends
4. Play together!

## Environment Variables

**Backend (Railway)**
```env
DATABASE_URL=postgres://...
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
```

**Frontend (Vercel)**
```env
VITE_SOCKET_URL=https://your-backend.railway.app
```

## Continuous Deployment

Both platforms auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Railway and Vercel will automatically deploy!

## Cost Breakdown

**Free tier:**
- Railway: $5 free credit/month
- Vercel Frontend: Free
- Vercel Postgres: Free tier available

**After free tier:**
- Railway: ~$5-10/month
- Vercel Postgres: ~$10/month (if exceeded free tier)

**Total: ~$5-20/month**

## Troubleshooting

**502 Bad Gateway**
```
Check Railway logs:
1. Railway → Deployments → Click latest
2. Look for errors in build/runtime logs
3. Verify Root Directory is set to "backend"
```

**CORS Errors**
```
Check:
1. CLIENT_URL in Railway matches Vercel frontend URL exactly
2. No trailing slash in CLIENT_URL
3. Redeploy backend after fixing
```

**Database Connection Failed**
```
Check:
1. DATABASE_URL is correct in Railway
2. Run npm run db:setup locally to verify URL works
3. Check Vercel Postgres is active
```

**Players Can't Join**
```
Check:
1. Game ID is correct
2. All 4 players using same Game ID
3. Backend is running (check Railway logs)
4. Browser console for errors
```

## Monitoring

**Railway Logs:**
Railway → Your Service → Click deployment → View Logs

**Vercel Logs:**
Vercel → Your Project → Logs tab

**Database:**
Vercel → Storage → Your DB → Data/Query tabs

## Scaling

As your game grows:
- Railway auto-scales with usage
- Vercel frontend is globally distributed
- Postgres can be upgraded in Vercel dashboard

---

**Need help?** Check the [main README](README.md) or open an issue on GitHub.
