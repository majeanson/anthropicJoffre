# Claude AI Development Guide

## Project Overview
Multiplayer Trick Card Game - Real-time 4-player, 2-team card game with WebSocket communication.

**Stack**: React + TypeScript, Tailwind CSS, Socket.io, Node.js, PostgreSQL

**Status**: Feature-complete (December 2025)
- 778 backend unit tests (~6s runtime)
- 22 E2E test files (Playwright)
- Full database persistence, game replay, social features

## Core Principles

1. **Small atomic components** - Favor new files over agglomeration
2. **Event-driven** - Use WebSocket events, NEVER setTimeout for game logic
3. **Player ID = name** - ALWAYS use player names, NEVER socket.ids (volatile on reconnect)
4. **Type safety** - Keep backend/frontend types in sync
5. **TDD workflow** - Write tests first, see docs/technical/TDD_WORKFLOW.md

### React Hooks Rule

**CRITICAL**: Early returns MUST come BEFORE hooks.

```tsx
// CORRECT
function Component({ data }) {
  if (!data) return null;        // Early return FIRST
  const [state, setState] = useState();  // Then hooks
}

// WRONG - Will crash React
function Component({ data }) {
  const [state, setState] = useState();
  if (!data) return null;        // Hooks already called!
}
```

## Game Rules Quick Reference

- **Betting**: 7-12 points, higher beats same amount
- **Without trump**: Beats same number with trump
- **Suit following**: MUST play led suit if you have it
- **Points**: 1 per trick, Red 0 = +5, Brown 0 = -2
- **Dealer**: Rotates clockwise, bets last

## Testing

```bash
cd backend && npm test          # 778 tests
cd e2e && npm run test:e2e      # E2E tests
```

## File Structure

```
backend/src/
  game/         # Pure game logic (deck, logic, state, validation)
  db/           # Database queries
  socketHandlers/  # Socket.io handlers (modular)
  api/          # REST endpoints
  utils/        # Helpers (logger, session, etc.)

frontend/src/
  components/   # UI components (one per file)
  contexts/     # React contexts (Auth, Skin)
  hooks/        # Custom hooks
  utils/        # Helpers
```

## Key Files

- `backend/src/index.ts` - Main server orchestration
- `backend/src/game/logic.ts` - Core game rules
- `frontend/src/App.tsx` - Main app + socket setup
- `frontend/src/components/PlayingPhase/` - Game board

## Documentation

See `docs/DOCUMENTATION_INDEX.md` for full docs including:
- Game rules: docs/technical/FEATURES.md
- Testing: docs/technical/BACKEND_TESTING.md
- Deployment: docs/deployment/RAILWAY_DEPLOY.md
