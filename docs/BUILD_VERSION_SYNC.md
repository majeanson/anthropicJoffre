# Build Version Synchronization Guide

## Overview
The project uses `buildInfo.json` to track version information, build status, and feature progress. There are two instances of this file that must stay synchronized:

1. **Root buildInfo.json** - The main source of truth at project root
2. **Frontend buildInfo.json** - Used by the debug panel at `frontend/src/buildInfo.json`

## Automatic Synchronization

### During Build
The build process automatically syncs both files:
```bash
npm run build
```
This runs `generate:build-info` and `sync:buildinfo` automatically.

### Manual Sync
To manually sync the frontend buildInfo with the root:
```bash
npm run sync:buildinfo
```

## Updating Build Info

### Step 1: Update Root buildInfo.json
Always update the root `buildInfo.json` first:
```json
{
  "version": "1.6.3",
  "releaseDate": "2025-11-05",
  ...
}
```

### Step 2: Sync to Frontend
Run the sync command:
```bash
npm run sync:buildinfo
```

Output:
```
✅ BuildInfo synchronized successfully!
   Version: 1.6.3
   Date: 2025-11-06T00:50:09.692Z
   Root: C:\Users\marc_\Documents\WebApp\anthropicJoffre\buildInfo.json
   Frontend: C:\Users\marc_\Documents\WebApp\anthropicJoffre\frontend\src\buildInfo.json
```

### Step 3: Verify in Debug Panel
1. Open the application
2. Enable debug mode in Settings > Advanced
3. Check the version number in the debug panel
4. It should match the version in buildInfo.json

## Build Process Integration

The sync is integrated into the build pipeline:

```json
// package.json
"scripts": {
  "generate:build-info": "node scripts/generate-build-info.js",
  "sync:buildinfo": "node scripts/sync-buildinfo.js",
  "build:frontend": "npm run generate:build-info && npm run sync:buildinfo && npm run build --prefix frontend",
  "build": "npm run build:backend && npm run build:frontend"
}
```

### Build Flow
1. `npm run build` triggers both backend and frontend builds
2. Frontend build runs:
   - `generate:build-info` - Updates root buildInfo.json with git data
   - `sync:buildinfo` - Copies to frontend/src/buildInfo.json
   - `build --prefix frontend` - Builds the frontend with correct version

## Production Verification

To verify your production build has the latest version:

1. **Check both files are in sync:**
   ```bash
   # Compare versions
   grep version buildInfo.json
   grep version frontend/src/buildInfo.json
   ```

2. **Check the built bundle:**
   ```bash
   # After building, the version is embedded in the bundle
   npm run build
   grep -o '"version":"[^"]*"' frontend/dist/assets/*.js
   ```

3. **Check in production:**
   - Open your deployed application
   - Enable debug mode (Settings > Advanced > Debug Mode)
   - Verify the version shown matches your buildInfo.json

## Troubleshooting

### Version Mismatch
If the debug panel shows an old version:
1. Run `npm run sync:buildinfo`
2. Rebuild: `npm run build:frontend`
3. Clear browser cache and reload

### Build Info Not Updating
If generate:build-info isn't updating:
1. Check you have committed your changes (it reads git data)
2. Manually update buildInfo.json
3. Run sync: `npm run sync:buildinfo`

### Manual Override
To manually set a version without git data:
1. Edit `buildInfo.json` directly
2. Run `npm run sync:buildinfo`
3. Skip `generate:build-info` and build directly

## Best Practices

1. **Always update root first** - The root buildInfo.json is the source of truth
2. **Sync before building** - Ensures production build has correct version
3. **Verify after deployment** - Check the debug panel shows expected version
4. **Use semantic versioning** - Follow major.minor.patch convention
5. **Document major changes** - Update the features array for major releases

## CI/CD Integration

For automated deployments, add to your CI/CD pipeline:
```yaml
# Example GitHub Actions
- name: Generate Build Info
  run: npm run generate:build-info

- name: Sync Build Info
  run: npm run sync:buildinfo

- name: Build Application
  run: npm run build

- name: Verify Version
  run: |
    VERSION=$(grep -o '"version":"[^"]*"' buildInfo.json | cut -d'"' -f4)
    echo "Building version: $VERSION"
```

---

*Last updated: November 2025*
*Purpose: Ensure build version consistency across development and production*