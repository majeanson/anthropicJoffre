# Next Steps - Deploy to Vercel

Your trick card game is now ready for deployment! Here's what to do next:

## ✅ Completed

- [x] Git repository initialized
- [x] Initial commit created
- [x] Frontend and backend builds tested and working
- [x] Vercel configuration files created
- [x] Deployment documentation written

## 📋 Deployment Checklist

### 1. Push to GitHub (5 minutes)

```bash
# Create a new repository on GitHub (https://github.com/new)
# Name it something like: trick-card-game

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/trick-card-game.git
git branch -M main
git push -u origin main
```

### 2. Set Up Vercel Postgres (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database**
3. Select **Postgres** → Continue
4. Name: `trick-game-db` (or your choice)
5. Select region (choose closest to you)
6. Click **Create**
7. Go to **.env.local** tab and copy the `DATABASE_URL`

### 3. Deploy Backend to Railway (Recommended - 10 minutes)

**Why Railway instead of Vercel for backend?**
- Better WebSocket support
- No 15-60 second timeout limits
- Free $5/month credit
- Easier to manage real-time connections

**Steps:**

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub**
4. Select your repository
5. Click **Add variables**:
   ```
   DATABASE_URL=<your_vercel_postgres_url>
   PORT=3001
   NODE_ENV=production
   CLIENT_URL=https://your-frontend.vercel.app
   ```
6. Under **Settings**:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`
7. Click **Deploy**
8. **Copy the Railway URL** (e.g., `https://your-app.railway.app`)

### 4. Set Up Database Schema (2 minutes)

**Option A: From your local machine**
```bash
cd backend
# Make sure DATABASE_URL in .env points to Vercel Postgres
npm run db:setup
```

**Option B: From Vercel Dashboard**
1. Go to Vercel → Storage → Your Postgres DB
2. Click **Query**
3. Copy contents of `backend/src/db/schema.sql`
4. Paste and click **Run**

### 5. Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_SOCKET_URL` = `https://your-backend.railway.app`
6. Click **Deploy**
7. **Copy the frontend URL**

### 6. Update Backend with Frontend URL (2 minutes)

1. Go to Railway dashboard
2. Click your project → **Variables**
3. Update `CLIENT_URL` with your Vercel frontend URL
4. Click **Redeploy**

## 🎮 Testing Your Deployment

1. Open your Vercel frontend URL in browser
2. Create a new game
3. Copy the Game ID
4. Open in incognito/private window (or different browser)
5. Join with the Game ID
6. Repeat for 4 total players
7. Play through a complete game!

## 🔧 Alternative: Deploy Both to Railway

If you prefer to deploy both frontend and backend to Railway:

1. Create two Railway projects:
   - One for backend (same as above)
   - One for frontend
2. Frontend configuration:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npm install -g serve && serve -s dist -p $PORT`
3. Set `VITE_SOCKET_URL` to backend Railway URL

## 📊 Monitoring

### Backend Logs
- Railway: Click project → **Logs** tab
- Watch for connection errors, game events

### Frontend Errors
- Check browser console (F12)
- Vercel: Dashboard → Your Project → **Logs**

### Database
- Vercel: Dashboard → Storage → Your DB → **Data** tab
- View game history records

## 🐛 Common Issues

**"WebSocket connection failed"**
- Check `VITE_SOCKET_URL` environment variable
- Ensure backend is deployed and running
- Check Railway logs for errors

**"Database connection error"**
- Verify `DATABASE_URL` is correct
- Ensure database schema is set up
- Check Vercel Postgres is active

**"Players can't join game"**
- Check backend CORS settings
- Verify `CLIENT_URL` matches frontend URL
- Check browser console for errors

## 💰 Cost Estimate

**Free Tier (Recommended for POC):**
- Frontend (Vercel): Free
- Backend (Railway): Free with $5 credit/month
- Database (Vercel Postgres): Free tier available (limited)

**Paid Tier (For production):**
- Vercel Pro: $20/month (if needed)
- Railway: ~$5-10/month (pay for what you use)
- Vercel Postgres: ~$10/month

## 🚀 After Deployment

Share your game with friends:
```
🎮 Play Trick Card Game!
https://your-game.vercel.app

Rules: https://github.com/YOUR_USERNAME/trick-card-game
```

## 📝 Optional Enhancements

After successful deployment, consider:

1. **Custom Domain**: Add custom domain in Vercel
2. **Analytics**: Add Vercel Analytics or Google Analytics
3. **Error Tracking**: Add Sentry or LogRocket
4. **Performance**: Add loading states, optimistic updates
5. **Features**: Chat, replay system, statistics
6. **Mobile**: PWA support, better mobile UI

## 🎯 Quick Commands Reference

```bash
# Check git status
git status

# View commit history
git log --oneline

# Create new branch for features
git checkout -b feature/new-feature

# Test locally
npm run dev  # from root (runs both servers)

# Build for production
npm run build  # from root (builds both)

# Run tests
cd backend && npm test
```

---

**Need Help?**
- Check DEPLOYMENT.md for detailed instructions
- Check QUICKSTART.md for local development
- Open an issue on GitHub
