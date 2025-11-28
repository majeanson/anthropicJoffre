# Storybook Deployment Guide

**Last Updated**: 2025-11-27
**Status**: ✅ **LOCAL DEVELOPMENT ONLY**

---

## 🎯 Overview

Storybook is available for local development only. It's NOT deployed to production (Railway) to reduce build time and deployment complexity. For production component documentation, use Storybook locally or deploy separately.

---

## 🌐 Access URLs

### Local Development
- **Backend**: `http://localhost:3000`
- **Storybook**: `http://localhost:3000/storybook` (after running `npm run build:local`)

### Production (Railway)
- **Backend**: `https://your-app.up.railway.app`
- **Storybook**: ❌ Not available in production (local development only)

---

## 🏗️ Build Process

### Production Build (Railway)

Railway builds **backend only** (fast build ~1-2 minutes):

```bash
npm run build
# Runs: npm run build:backend
# Output: dist/ (TypeScript compiled)
```

**Storybook is NOT included** in production builds to keep deployment fast and simple.

### Local Development Build (with Storybook)

To use Storybook locally:

```bash
cd backend

# Build backend + Storybook (6-8 minutes)
npm run build:local

# Start server
npm start

# Access Storybook at http://localhost:3000/storybook
```

**Build steps** (`build:local`):
1. Compile backend TypeScript → `dist/`
2. Install frontend dependencies
3. Build Storybook static site → `frontend/storybook-static/`
4. Copy to `backend/public/storybook/`

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
    "build": "npm run build:backend",
    "build:backend": "tsc -p tsconfig.build.json",
    "build:local": "npm run build:backend && npm run build:storybook",
    "build:storybook": "cd ../frontend && npm install --legacy-peer-deps && npm run build-storybook && node -e \"...\""
  }
}
```

**Key Difference**:
- `npm run build` - Production build (backend only, used by Railway)
- `npm run build:local` - Local development build (backend + Storybook)

### Backend Static Serving

**File**: `backend/src/index.ts` (line 437)
```typescript
// Serve Storybook static files at /storybook (Sprint 20)
const storybookPath = resolve(__dirname, '../public/storybook');
if (existsSync(storybookPath)) {
  app.use('/storybook', express.static(storybookPath));
  logger.info('Storybook static files available at /storybook');
} else {
  logger.warn('Storybook not built - run "npm run build:local" to enable');
}
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

### Storybook Not Loading Locally

1. **Check build**: Run `npm run build:local` in backend directory
2. **Check file path**: Ensure `backend/public/storybook/index.html` exists
3. **Check URL**: Access `http://localhost:3000/storybook` (with or without trailing slash)
4. **Check logs**: Look for "Storybook static files available at /storybook" message

### CORS Issues

Storybook is served from same domain as backend, so no CORS configuration needed.

---

## 📈 Performance

### Build Time Impact
- **Production (Railway)**: Backend only ~1-2 minutes (fast!)
- **Local Development**: Backend + Storybook ~6-8 minutes
- **Caching**: Subsequent local builds ~3-5 minutes with cached dependencies

### Runtime Performance
- **No performance impact** - Static files served via Express
- **Local only** - Does not affect production deployment size or speed

---

## 🔄 Updating Storybook

### Add New Component Stories

1. Create story file: `frontend/src/components/ui/stories/NewComponent.stories.tsx`
2. Run `npm run build:local` in backend directory (local dev only)
3. Access at `http://localhost:3000/storybook`

### Update Existing Stories

1. Edit story file in `frontend/src/components/ui/stories/`
2. Run `npm run build:local` in backend directory (local dev only)
3. Refresh browser at `http://localhost:3000/storybook`

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

**Status**: ✅ **LOCAL DEVELOPMENT ONLY**
**Last Verified**: 2025-11-27
**Railway Build Time**: ~1-2 minutes (backend only)
