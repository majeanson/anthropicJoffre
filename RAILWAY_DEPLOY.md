# Deploy to Railway + Vercel - Production Setup

**Perfect for real-time games!** This setup gives you:
- ✅ No WebSocket timeouts
- ✅ Fast, reliable connections
- ✅ ~$5-10/month total cost
- ✅ Production-ready

## Architecture

- **Frontend**: Vercel (Free, fast CDN)
- **Backend**: Railway (WebSocket-optimized, $5 free credit)
- **Database**: Vercel Postgres (Free tier or $10/month)

---

## ⚠️ Important Note

**The backend code is in the `/backend` folder**, not the root.

When deploying to Railway, you MUST set the **Root Directory** to `backend` (see Step 4). Otherwise Railway will look in the wrong place and fail with "No start command was found".

---

## 📋 Deployment Steps

### Step 1: Set Up Vercel Postgres (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database**
3. Select **Postgres** → **Continue**
4. Database name: `trick-game-db`
5. Select region closest to you
6. Click **Create**
7. Go to **Quickstart** tab → **.env.local**
8. **Copy the connection string** (looks like: `postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb`)
9. Keep this tab open - you'll need it!

### Step 2: Set Up Database Schema (2 minutes)

From your local machine:

```bash
cd backend

# Create .env with your Vercel Postgres URL
echo "DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb" > .env

# Run setup
npm run db:setup
```

You should see: `✅ Database tables created successfully!`

### Step 3: Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app
2. Click **Login** → **Sign in with GitHub**
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Click **Configure GitHub App** (if first time)
6. Select your repository: `majeanson/anthropicJoffre`
7. Click **Add variables** (we'll add them in next step)
8. Click **Deploy**

**Important:** The initial deployment may fail - that's expected! We need to configure it first.

### Step 4: Set Backend Root Directory (CRITICAL - Do This First!)

⚠️ **Railway is trying to deploy from the root, but our backend is in `/backend`**

1. In Railway, click on your service (should show build error)
2. Click **Settings** tab
3. Scroll down to **Service Settings** section
4. Find **Root Directory**
5. Click the field and enter: `backend`
6. Click outside to save
7. Scroll down and click **Redeploy** (or it will auto-redeploy)

Now Railway will look in the `backend` folder and find the `package.json`!

### Step 5: Configure Backend Environment Variables (3 minutes)

In the Railway dashboard:

1. Click on your deployed service
2. Click **Variables** tab
3. Click **+ New Variable** for each:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Your Vercel Postgres URL | `postgres://default:xxx@...` |
| `NODE_ENV` | `production` | `production` |
| `PORT` | Railway auto-sets this | (leave empty) |
| `CLIENT_URL` | Your frontend URL (add after Step 6) | `https://trick-game.vercel.app` |

4. Click **Deploy** (Railway will redeploy)

### Step 6: Get Your Railway Backend URL

1. In Railway, click **Settings** tab
2. Scroll to **Domains**
3. Click **Generate Domain**
4. **Copy this URL!** (e.g., `https://anthropicjoffre-production.up.railway.app`)

### Step 7: Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `majeanson/anthropicJoffre`
4. Click **Import**

**Project Configuration:**
- **Project Name**: `trick-game` (or your choice)
- **Framework Preset**: Vite
- **Root Directory**: `frontend` ⭐
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables:**
Click **Add**:

| Name | Value |
|------|-------|
| `VITE_SOCKET_URL` | Your Railway backend URL from Step 6 |

Example:
```
VITE_SOCKET_URL=https://anthropicjoffre-production.up.railway.app
```

5. Click **Deploy**
6. Wait for deployment
7. **Copy your frontend URL** (e.g., `https://trick-game.vercel.app`)

### Step 8: Link Backend to Frontend (2 minutes)

1. Go back to **Railway dashboard**
2. Click **Variables** tab
3. Add new variable:
   - Name: `CLIENT_URL`
   - Value: Your Vercel frontend URL
4. Click **Deploy** to redeploy

Example:
```
CLIENT_URL=https://trick-game.vercel.app
```

---

## ✅ Test Your Deployment!

1. Open your frontend URL: `https://trick-game.vercel.app`
2. Click **Create Game**
3. Enter your name
4. Copy the Game ID
5. Open in **4 different browsers/devices**:
   - Your phone
   - Incognito window
   - Different browser
   - Friend's device
6. Each joins with the Game ID
7. **Play a full game!** 🎮

The connections should stay stable - no disconnections! 🎉

---

## 🔧 Troubleshooting

### Frontend can't connect to backend

**Check:**
```bash
# In browser console (F12), look for:
WebSocket connection to 'wss://...' failed
```

**Fix:**
1. Verify `VITE_SOCKET_URL` in Vercel frontend settings
2. Make sure it's your Railway URL (not localhost!)
3. Redeploy frontend after changing

### CORS errors

**Check browser console for:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
1. Verify `CLIENT_URL` in Railway backend
2. Should match frontend URL exactly
3. Redeploy backend

### Database errors

**Check Railway logs for:**
```
Error: connection to database failed
```

**Fix:**
1. Verify `DATABASE_URL` in Railway
2. Test connection locally: `npm run db:setup`
3. Check Vercel Postgres is active

### Backend won't start

**Check Railway logs:**
1. Click your service → **Deployments** tab
2. Click latest deployment → **View Logs**

**Common issues:**
- Wrong root directory (should be `backend`)
- Missing environment variables
- Build failed (check build logs)

---

## 📊 Monitor Your App

### Railway Logs
1. Click your service
2. Click **Deployments** tab
3. Click **View Logs**
4. Watch for:
   - `Server running on port XXX` ✅
   - Connection errors ❌
   - Game events 🎮

### Vercel Frontend Logs
1. Go to Vercel dashboard
2. Click your project
3. Click **Logs** tab

### Database Monitoring
1. Go to Vercel → Storage
2. Click your Postgres database
3. **Data** tab: View game history
4. **Query** tab: Run SQL queries
5. **Metrics** tab: See usage

---

## 💰 Costs Breakdown

### Free Tier (Perfect for testing)
- **Railway**: $5 free credit/month (~500 hours)
- **Vercel Frontend**: Free (Hobby plan)
- **Vercel Postgres**: Free tier (~256MB, 60 hours)

**Total: FREE for first month!**

### After Free Credit (~Month 2+)
- **Railway**: ~$5-10/month (pay-as-you-go)
  - $0.000231/GB-hour RAM
  - $0.000463/vCPU-hour
  - Estimate: $5-7 for small game
- **Vercel Frontend**: Still FREE
- **Vercel Postgres**: ~$10/month (if exceeded free tier)

**Total: ~$5-17/month**

### Scale Up Later
When you have 100+ concurrent players:
- Railway: ~$20-30/month (auto-scales)
- Vercel Pro: $20/month (better analytics)
- Postgres: Scale as needed

---

## 🔄 Continuous Deployment

Both platforms auto-deploy on git push!

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Railway deploys backend automatically
# Vercel deploys frontend automatically
```

### Deploy Specific Branches
- **Main branch**: Production
- **Other branches**: Preview deployments (Vercel)

---

## 🚀 Advanced: Environment Management

### Development
```bash
# Local development
npm run dev  # Uses .env files
```

### Staging (Optional)
Create a staging environment:
1. Railway: Create new service from `staging` branch
2. Vercel: Auto-creates preview for `staging` branch

### Production
- Railway: Deploys from `main` branch
- Vercel: Deploys from `main` branch

---

## 📝 Environment Variables Cheat Sheet

### Backend (Railway)
```env
DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb
NODE_ENV=production
CLIENT_URL=https://trick-game.vercel.app
# PORT is auto-set by Railway
```

### Frontend (Vercel)
```env
VITE_SOCKET_URL=https://anthropicjoffre-production.up.railway.app
```

---

## 🎯 What You Get

✅ **No WebSocket timeouts** - Players stay connected
✅ **Fast global CDN** - Frontend loads instantly
✅ **Auto-scaling** - Handles traffic spikes
✅ **HTTPS included** - Secure connections
✅ **Auto-deploys** - Push to deploy
✅ **Logs & monitoring** - Debug easily
✅ **$5-10/month** - Affordable for production

---

## 🆘 Need Help?

**Railway Issues:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Discord: https://discord.com/invite/vercel

**Game Issues:**
- GitHub: https://github.com/majeanson/anthropicJoffre/issues
- Check QUICKSTART.md for local dev

---

## 🎮 After Deployment

Share with friends:
```
🎮 Play Trick Card Game!
https://trick-game.vercel.app

Need 4 players - share this link!
```

**Next steps:**
1. Test with real players
2. Monitor logs for errors
3. Add features based on feedback
4. Scale as needed!

Enjoy your production game! 🚀
