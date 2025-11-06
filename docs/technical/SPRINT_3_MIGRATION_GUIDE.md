# Sprint 3 Migration Guide

**For Developers Joining Post-Sprint 3**
**Last Updated**: 2025-11-06
**Sprint Completion**: October 2025

---

## 📋 What Changed in Sprint 3?

Sprint 3 added complete user authentication, email services, social features, and refactored backend architecture. This guide helps you understand the new systems and how to work with them.

---

## 🔐 Authentication System

### Overview

Sprint 3 added a complete JWT-based authentication system with email verification and password reset.

### Key Files

**Backend**:
- `backend/src/db/users.ts` - User CRUD operations
- `backend/src/api/auth.ts` - REST endpoints
- `backend/src/utils/authHelpers.ts` - JWT generation/validation
- `backend/src/utils/emailService.ts` - Email sending

**Frontend**:
- `frontend/src/contexts/AuthContext.tsx` - Global auth state
- `frontend/src/components/LoginModal.tsx` - Login UI
- `frontend/src/components/RegisterModal.tsx` - Registration UI
- `frontend/src/components/PasswordResetModal.tsx` - Password reset UI

### How Authentication Works

```typescript
// 1. User registers
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "player123",
  "password": "secure_password"
}
// Returns: { success: true, message: "Check email for verification" }

// 2. User receives email with token and clicks link
GET /api/auth/verify-email?token=abc123
// Redirects to login page

// 3. User logs in
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}
// Returns: { user: {...}, token: "jwt_token_here" }

// 4. Frontend stores token in localStorage and AuthContext
```

### Integrating Authentication in Components

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login to access this feature</div>;
  }

  return <div>Welcome, {user.username}!</div>;
}
```

### Guest vs. Authenticated Mode

**Key Pattern**: Never block gameplay with authentication

```typescript
// In Lobby or App.tsx
const playerName = isAuthenticated
  ? user.username
  : localStorage.getItem('playerName') || 'Guest';

// Guest players can play, but features are limited:
const canAccessFeature = (feature: string) => {
  const authRequired = ['friends', 'achievements', 'profiles'];
  return !authRequired.includes(feature) || isAuthenticated;
};
```

---

## 📧 Email Service

### Overview

Sprint 3 uses **Resend** (HTTP API) instead of SMTP because Railway blocks SMTP ports.

### Setup

1. **Get Resend API Key**: https://resend.com/api-keys
2. **Add to Railway Environment**:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=Jaffre <onboarding@resend.dev>
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Development vs. Production

**Development** (Free Tier):
- Use `onboarding@resend.dev` as sender
- Can only send to your own email (the one you used to sign up for Resend)
- Perfect for testing

**Production** (Custom Domain):
- Buy a domain ($10-15/year)
- Verify it in Resend dashboard
- Update `EMAIL_FROM` to use your domain
- Can send to any user

### How to Add Email Templates

```typescript
// In backend/src/utils/emailService.ts
export async function sendMyCustomEmail(
  email: string,
  data: any
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    // Dev mode fallback
    console.log(`[DEV MODE] Would send email to ${email}`);
    return false;
  }

  const { data: result, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'My Subject',
    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>My Email</h1>
          <p>${data.message}</p>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Email send error:', error);
    return false;
  }

  return true;
}
```

**Important**: Email failures should NEVER block user flows. Always return `false` gracefully.

---

## 🪟 Modal State Management

### Problem Solved

Before Sprint 3, modals would lose form state when closed/reopened due to React re-renders.

### Solution: ModalContext

**Pattern**: Keep modals mounted but hidden

```typescript
// In App.tsx
import { ModalProvider } from './contexts/ModalContext';

<ModalProvider>
  <LoginModal />
  <RegisterModal />
  <PasswordResetModal />
  <MyApp />
</ModalProvider>

// Modals stay mounted, so form state persists
```

### Creating a New Modal

```typescript
import { useModal } from '../contexts/ModalContext';

export function MyModal() {
  const { activeModal, closeModal } = useModal();
  const [formData, setFormData] = useState({ /* ... */ });

  // Early return - modal stays mounted
  if (activeModal !== 'my-modal') return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={closeModal} // Backdrop closes modal
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md mx-auto mt-20"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click
      >
        <h2>My Modal</h2>
        {/* Form state persists when modal reopens */}
        <input
          value={formData.field}
          onChange={(e) => setFormData({ ...formData, field: e.target.value })}
        />
      </div>
    </div>
  );
}

// To open modal from anywhere:
function SomeComponent() {
  const { openModal } = useModal();

  return <button onClick={() => openModal('my-modal')}>Open</button>;
}
```

---

## 🏗️ Backend Architecture

### Socket Handler Refactoring

**Before Sprint 3**: Monolithic `index.ts` (2,500+ lines)

**After Sprint 3**: Modular handlers (200-300 lines each)

### File Structure

```
backend/src/socketHandlers/
├── lobby.ts          - Game creation, joining
├── gameplay.ts       - Betting, card playing
├── chat.ts           - Chat messages
├── connection.ts     - Reconnection
├── bots.ts           - Bot management
├── stats.ts          - Stats and leaderboard
├── admin.ts          - Admin actions
├── achievements.ts   - Achievements
├── friends.ts        - Friend system
└── notifications.ts  - Notifications
```

### Creating a New Socket Handler

1. **Create file**: `backend/src/socketHandlers/myFeature.ts`

```typescript
import { Server, Socket } from 'socket.io';
import { GameState } from '../types/game';

export function registerMyFeatureHandlers(
  io: Server,
  socket: Socket,
  games: Map<string, GameState>
) {
  socket.on('my_event', async (data: { gameId: string; /* ... */ }) => {
    try {
      const game = games.get(data.gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Do something with game state
      game.someField = data.value;

      // Emit update to all players
      io.to(data.gameId).emit('game_updated', game);

    } catch (error) {
      console.error('Error in my_event:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });
}
```

2. **Register in `backend/src/index.ts`**:

```typescript
import { registerMyFeatureHandlers } from './socketHandlers/myFeature';

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Register all handlers
  registerLobbyHandlers(io, socket, games);
  registerGameplayHandlers(io, socket, games);
  registerMyFeatureHandlers(io, socket, games); // Add here
  // ...
});
```

3. **Update `CLAUDE.md` WebSocket events section** with new events

---

## 🗄️ Database Migrations

### How Migrations Work

**Pattern**: Sequential numbered SQL files

```
backend/src/db/migrations/
├── 001_initial_schema.sql
├── 002_add_spectators.sql
├── ...
├── 012_user_authentication.sql
├── 013_user_profiles.sql
└── 015_notifications.sql
```

### Creating a New Migration

1. **Create file**: `backend/src/db/migrations/016_my_feature.sql`

```sql
-- Add new table
CREATE TABLE IF NOT EXISTS my_feature (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance
CREATE INDEX idx_my_feature_user_id ON my_feature(user_id);
```

2. **Run migrations**:
```bash
cd backend
npm run migrate
```

3. **Update schema.sql** if needed for new deployments

### Migration Best Practices

- Always use `IF NOT EXISTS` / `IF EXISTS`
- Add indexes for foreign keys
- Use `ON DELETE CASCADE` where appropriate
- Test migration locally before deploying
- Never modify existing migrations (create new ones)

---

## 🎨 Frontend Patterns

### Component Organization

**Sprint 3 introduced clear component categories**:

```
frontend/src/components/
├── modals/              - Modal dialogs (login, register, etc.)
├── settings/            - Settings panel tabs
├── achievements/        - Achievement system
├── notifications/       - Notification center
├── profiles/            - User profiles
├── friends/             - Friend management
└── [phase]Phase.tsx     - Game phase components
```

### When to Create a New Component

**Create new component if**:
- Over 200 lines
- Multiple responsibilities
- Reusable elsewhere
- Complex state logic

**Keep in same file if**:
- Tightly coupled
- Only used once
- Simple helper component

### State Management Pattern

```
Global State (Context):
- AuthContext     - User authentication
- SettingsContext - User preferences
- ModalContext    - Modal visibility

Component State (useState):
- Form inputs
- UI toggles
- Local validation

Server State (Props):
- GameState from socket
- Player stats
- Leaderboard data
```

---

## 🧪 Testing Strategy

### What to Test

**Backend** (Vitest):
- Pure functions in `/game/` directory
- Database operations
- Validation logic

**Frontend** (E2E with Playwright):
- Critical user flows
- Game mechanics
- UI interactions

### Running Tests

```bash
# Backend unit tests
cd backend
npm test

# E2E tests
cd e2e
npx playwright test

# Specific test file
npx playwright test 04-game-flow.spec.ts
```

---

## 🚀 Deployment

### Environment Variables

**Railway (Backend)**:
```bash
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
SENTRY_DSN=...
RESEND_API_KEY=re_...
EMAIL_FROM=Jaffre <onboarding@resend.dev>
FRONTEND_URL=https://your-app.vercel.app
```

**Vercel (Frontend)**:
```bash
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_API_URL=https://your-backend.railway.app
```

### Deployment Checklist

- [ ] Backend tests passing
- [ ] Frontend builds successfully
- [ ] Environment variables set in Railway
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Email service tested (send to yourself)
- [ ] Monitor Sentry for errors

---

## 📚 Additional Resources

**Core Documentation**:
- `CLAUDE.md` - Main development guide
- `ROADMAP.md` - Project status and future plans
- `docs/technical/FEATURES.md` - Feature documentation

**Sprint 3 Specific**:
- `docs/sprints/SPRINT_PLAN_3_MAJOR_FEATURES.md` - Original plan
- `docs/sprints/SPRINT_1_PROGRESS.md` - Progress tracking
- `docs/deployment/EMAIL_SETUP.md` - Email setup guide (to be created)

**Architecture**:
- `docs/technical/BACKEND_ARCHITECTURE.md` - Backend patterns
- `docs/technical/VALIDATION_SYSTEM.md` - Validation layers
- `docs/technical/RECONNECTION_FLOW.md` - Reconnection logic (to be created)

---

## 🐛 Common Issues

### Email Not Sending

**Issue**: Emails not received
**Solution**:
1. Check Railway logs for email errors
2. Verify `RESEND_API_KEY` is set
3. Ensure recipient email matches your Resend signup email (free tier)
4. Check Resend dashboard for send attempts

### Authentication Token Expired

**Issue**: "Token expired" error
**Solution**:
- Tokens expire after 7 days
- User must log in again
- Frontend automatically redirects to login

### Modal Form Clearing

**Issue**: Form loses data when closed
**Solution**:
- Ensure component uses ModalContext
- Check modal stays mounted (use conditional render, not mount/unmount)
- Verify `activeModal` check is correct

### Socket Reconnection Fails

**Issue**: Player can't reconnect after disconnect
**Solution**:
- Check `playerName` stored in localStorage
- Verify session token valid
- See `docs/technical/RECONNECTION_FLOW.md` for details

---

## 💡 Tips for New Features

1. **Plan First**: Read existing patterns in CLAUDE.md
2. **Small PRs**: Break features into phases
3. **Test Early**: Write backend tests first
4. **Document**: Update CLAUDE.md with new patterns
5. **Commit Often**: Small, focused commits
6. **Check Types**: Run `npm run type-check` before pushing

---

**Questions?** Check `CLAUDE.md` or ask the team!

---

*Last Updated: 2025-11-06*
*Sprint 3 Completion: October 2025*
