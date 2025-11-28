# Storybook Production Deployment

**Last Updated**: 2025-11-27
**Status**: ✅ **PRODUCTION READY**

---

## 🎯 Overview

Storybook is automatically built and deployed with the backend to Railway. It's accessible at `/storybook` route on the production backend URL.

---

## 🌐 Production URLs

### Development
- **Backend**: `http://localhost:3000`
- **Storybook**: `http://localhost:3000/storybook`

### Production (Railway)
- **Backend**: `https://your-app.up.railway.app` *(replace with your Railway URL)*
- **Storybook**: `https://your-app.up.railway.app/storybook`

---

## 🏗️ Build Process

### Automatic (Railway Deployment)

When you push to `main` branch, Railway automatically:

1. **Builds backend** (`npm run build:backend`)
   - Compiles TypeScript to `dist/`

2. **Builds Storybook** (`npm run build:storybook`)
   - Installs frontend dependencies
   - Builds Storybook static site
   - Copies to `backend/public/storybook/`

3. **Serves Storybook**
   - Express static middleware at `/storybook` route
   - Configured in `backend/src/index.ts:437`

**Total Build Time**: ~5-8 minutes (backend ~1min + Storybook ~3-5min + dependencies ~2min)

### Manual Local Build

```bash
cd backend
npm run build
npm start

# Access at http://localhost:3000/storybook
```

---

## 📁 File Structure

```
backend/
├── package.json          # Build scripts
├── src/
│   └── index.ts         # Express static middleware (line 437)
├── public/              # Generated (not in git)
│   └── storybook/       # Built Storybook files
└── dist/                # Built backend

frontend/
├── .storybook/          # Storybook config
├── src/
│   └── components/ui/stories/  # Component stories (53 stories)
└── storybook-static/    # Generated (not in git)
```

---

## 🔧 Configuration

### Backend `package.json` Scripts

```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:storybook",
    "build:backend": "tsc -p tsconfig.build.json",
    "build:storybook": "cd ../frontend && npm install --legacy-peer-deps && npm run build-storybook && node -e \"...\""
  }
}
```

### Backend Static Serving

**File**: `backend/src/index.ts` (line 437)
```typescript
// Serve Storybook static files at /storybook (Sprint 20)
app.use('/storybook', express.static(resolve(__dirname, '../public/storybook')));
```

### `.gitignore`

```
storybook-static/
backend/public/storybook/
```

---

## 🚀 Deployment Checklist

- [x] Storybook builds automatically on Railway
- [x] Static files copied to `backend/public/storybook`
- [x] Backend serves files at `/storybook` route
- [x] `.gitignore` excludes generated files
- [x] Build scripts are cross-platform compatible
- [x] Production URL documented

---

## 📊 Build Output

### Storybook Static Site Size
- **Uncompressed**: ~2.5 MB
- **Gzipped**: ~800 KB
- **Files**: ~150 static files

### Component Stories
- **Total**: 53 interactive examples
- **Categories**:
  - Foundation (3): Button, IconButton, Modal
  - Social (5): OnlineStatusBadge, SocialListItem, MessageBubble, ConversationItem, UnreadBadge

---

## 🔍 Troubleshooting

### Build Fails on Railway

**Error**: `npm install` dependency conflicts
**Fix**: Using `--legacy-peer-deps` flag in build script

**Error**: Copy command fails
**Fix**: Using Node.js `fs.cpSync()` instead of shell `cp` command

### Storybook Not Loading in Production

1. **Check build logs**: Verify Storybook build completed
2. **Check file path**: Ensure `backend/public/storybook/index.html` exists
3. **Check URL**: Must access `/storybook/` (with trailing slash) or `/storybook`
4. **Check Railway logs**: Look for Express static middleware errors

### CORS Issues

Storybook is served from same domain as backend, so no CORS configuration needed.

---

## 📈 Performance

### Build Time Impact
- **Before**: Backend build ~1 minute
- **After**: Backend + Storybook ~6-8 minutes
- **Caching**: Railway caches `node_modules`, subsequent builds ~3-5 minutes

### Runtime Performance
- **No performance impact** - Static files served via Express
- **CDN-ready** - Can be served via Railway's edge network

---

## 🔄 Updating Storybook

### Add New Component Stories

1. Create story file: `frontend/src/components/ui/stories/NewComponent.stories.tsx`
2. Push to `main` branch
3. Railway auto-deploys with new stories

### Update Existing Stories

1. Edit story file in `frontend/src/components/ui/stories/`
2. Push to `main` branch
3. Railway auto-deploys with updates

---

## 🎯 Next Steps

### Future Enhancements (Optional)

1. **Separate Storybook Subdomain**
   - Deploy to `storybook.your-domain.com`
   - Separate Railway service (~$5/month)

2. **Chromatic Integration**
   - Visual regression testing
   - Free tier: 5,000 snapshots/month

3. **Storybook Cache**
   - Cache Storybook build between deployments
   - Reduce build time to ~1-2 minutes

---

## 📝 Related Documentation

- [Sprint 20 Summary](../sprints/sprint20-complete.md)
- [Storybook Official Docs](https://storybook.js.org/docs)
- [Railway Deployment Guide](./RAILWAY_DEPLOY.md)

---

**Status**: ✅ Production deployment working
**Last Verified**: 2025-11-27
**Railway Build Time**: ~6-8 minutes
