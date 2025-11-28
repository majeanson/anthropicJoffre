# Chromatic Storybook Deployment

**Status**: ✅ Ready to deploy
**Auto-Deploy**: Every push to `main` branch (via GitHub Actions)

---

## 🎯 What You Get

- **Live Storybook URL**: Public link to share with team/stakeholders
- **Auto-Deploy**: Pushes to `main` → Storybook updates automatically
- **Visual Testing**: See component changes side-by-side
- **Free Tier**: 5,000 snapshots/month (plenty for solo dev)

---

## 🚀 Setup (5 minutes)

### Step 1: Create Chromatic Account

1. Go to https://www.chromatic.com/start
2. Click "Sign in with GitHub"
3. Authorize Chromatic

### Step 2: Create Project

1. Click "Add project"
2. Select your `anthropicJoffre` repository
3. Copy the **Project Token** (looks like `chpt_1234567890abcdef`)

### Step 3: Add GitHub Secret

1. Go to your GitHub repo: https://github.com/majeanson/anthropicJoffre
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CHROMATIC_PROJECT_TOKEN`
5. Value: Paste your project token from Step 2
6. Click **Add secret**

### Step 4: Push to GitHub

```bash
git add .github/workflows/chromatic.yml
git commit -m "ci: Add Chromatic auto-deploy for Storybook"
git push
```

### Step 5: Get Your Storybook URL

1. Go to **Actions** tab in GitHub
2. Wait for "Deploy Storybook to Chromatic" to finish (~2-3 minutes)
3. Click on the workflow → Check the Chromatic step for your URL
4. Your Storybook will be at: `https://[random-id].chromatic.com`

---

## 🔄 Workflow

### Adding a New Component

1. Create component: `frontend/src/components/ui/NewComponent.tsx`
2. Create story: `frontend/src/components/ui/stories/NewComponent.stories.tsx`
3. Commit and push to `main`
4. GitHub Actions automatically deploys to Chromatic (2-3 min)
5. Visit your Storybook URL to see the new component

### Example Story File

```tsx
// frontend/src/components/ui/stories/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from '../NewComponent';

const meta = {
  title: 'UI/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NewComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Your props here
  },
};
```

---

## 📊 Triggers

GitHub Action runs automatically when you push changes to:
- `frontend/src/components/**` (any component file)
- `frontend/.storybook/**` (Storybook config)
- `frontend/package.json` (dependencies)

---

## 💰 Pricing

**Free Tier** (Perfect for solo dev):
- 5,000 snapshots/month
- Unlimited team members
- Unlimited projects
- Public Storybook hosting

**Paid Plans** (only if you need more):
- $149/month for 25,000 snapshots
- Visual regression testing
- Private Storybook

---

## 🔍 Monitoring Deployments

### View Build Logs
```bash
# Go to GitHub repo → Actions tab
# Click on latest "Deploy Storybook to Chromatic" workflow
```

### View Chromatic Dashboard
```bash
# Go to https://www.chromatic.com/builds
# See all deployments, visual changes, and history
```

---

## 🛠️ Troubleshooting

### Build Fails: "Missing CHROMATIC_PROJECT_TOKEN"
- Check GitHub repo → Settings → Secrets → Actions
- Ensure `CHROMATIC_PROJECT_TOKEN` exists

### Build Fails: npm install errors
- The workflow uses `--legacy-peer-deps` flag (same as local builds)
- Check GitHub Actions logs for specific error

### Storybook Not Updating
- Check that you pushed to `main` branch
- Verify changes are in `frontend/src/components/**` directory
- Wait 2-3 minutes for build to complete

---

## 📝 Alternative: Local Preview

If you just need to test locally before deploying:

```bash
cd frontend
npm run storybook
# Access at http://localhost:6006
```

---

## 🎯 Next Steps

1. Complete setup steps above
2. Push your first component to see it auto-deploy
3. Share your Storybook URL with team/stakeholders
4. (Optional) Enable visual regression testing in Chromatic dashboard

---

**Related Docs**:
- [Chromatic Documentation](https://www.chromatic.com/docs)
- [Storybook Local Setup](./STORYBOOK_PRODUCTION.md)
- [GitHub Actions](https://docs.github.com/en/actions)
