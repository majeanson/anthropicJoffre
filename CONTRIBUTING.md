# Contributing Guide

Thank you for your interest in contributing! This guide will help you add features and improvements to the trick card game.

## Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/anthropicJoffre.git
cd anthropicJoffre

# Install dependencies
npm run install:all

# Set up environment (see QUICKSTART.md)
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# Start development servers
cd .. && npm run dev
```

## Project Architecture

### Backend (`/backend`)

**Entry Point:** `src/index.ts`
- Express server with Socket.io
- REST endpoints for health checks and game history
- Socket.io events for real-time gameplay

**Key Directories:**
- `src/db/` - Database queries and schema
- `src/game/` - Game logic (deck, rules, scoring)
- `src/types/` - TypeScript type definitions

### Frontend (`/frontend`)

**Entry Point:** `src/main.tsx` → `src/App.tsx`
- React app with Socket.io client
- Real-time game state management
- Tailwind CSS for styling

**Key Directories:**
- `src/components/` - React components for each game phase
- `src/types/` - TypeScript type definitions (matches backend)

## Adding New Features

### Example: Add Chat Feature

**1. Update Types** (`backend/src/types/game.ts`)
```typescript
export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

export interface GameState {
  // ... existing fields
  chatMessages: ChatMessage[];
}
```

**2. Update Backend** (`backend/src/index.ts`)
```typescript
// Add socket event handler
socket.on('send_chat', ({ gameId, message }: { gameId: string; message: string }) => {
  const game = games.get(gameId);
  if (!game) return;

  const player = game.players.find(p => p.id === socket.id);
  if (!player) return;

  const chatMessage: ChatMessage = {
    playerId: socket.id,
    playerName: player.name,
    message,
    timestamp: new Date(),
  };

  game.chatMessages.push(chatMessage);
  io.to(gameId).emit('chat_message', chatMessage);
});
```

**3. Update Frontend Types** (`frontend/src/types/game.ts`)
```typescript
// Copy the ChatMessage interface from backend
export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}
```

**4. Create Chat Component** (`frontend/src/components/Chat.tsx`)
```typescript
import { useState } from 'react';
import { ChatMessage } from '../types/game';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export function Chat({ messages, onSendMessage }: ChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="h-48 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <span className="font-bold">{msg.playerName}:</span> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Type a message..."
        />
      </form>
    </div>
  );
}
```

**5. Wire Up in App** (`frontend/src/App.tsx`)
```typescript
// Add socket listener
socket.on('chat_message', (message: ChatMessage) => {
  setGameState(prev => prev ? {
    ...prev,
    chatMessages: [...prev.chatMessages, message]
  } : null);
});

// Add send function
const handleSendMessage = (message: string) => {
  if (socket && gameId) {
    socket.emit('send_chat', { gameId, message });
  }
};

// Render in UI
<Chat
  messages={gameState.chatMessages}
  onSendMessage={handleSendMessage}
/>
```

## Code Style

### TypeScript
- Use strict mode
- Define all types explicitly
- Share types between frontend/backend

### React Components
- Keep components small (<200 lines)
- Use functional components with hooks
- Props should be typed interfaces

### Socket.io Events
- Use descriptive event names (`create_game`, not `cg`)
- Always validate data on backend
- Emit to specific rooms/sockets, not globally

### Tailwind CSS
- Reuse utility classes
- Use semantic color names
- Keep responsive design in mind

## Testing

### Backend Tests
```bash
cd backend
npm test
```

**Add new tests:** `backend/src/game/*.test.ts`

Example:
```typescript
describe('New Feature', () => {
  it('should do something', () => {
    expect(newFunction()).toBe(expected);
  });
});
```

### Manual Testing
1. Start development servers
2. Open 4 browser windows
3. Test full game flow
4. Test edge cases (disconnect, rejoin, etc.)

## Database Changes

### Adding New Tables
1. Update `backend/src/db/schema.sql`
2. Add query functions in `backend/src/db/index.ts`
3. Run `npm run db:setup` to test

### Example: Add player stats
```sql
-- In schema.sql
CREATE TABLE IF NOT EXISTS player_stats (
    player_id VARCHAR(255) PRIMARY KEY,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0
);
```

```typescript
// In db/index.ts
export const updatePlayerStats = async (playerId: string, won: boolean) => {
  const text = `
    INSERT INTO player_stats (player_id, games_played, games_won)
    VALUES ($1, 1, $2)
    ON CONFLICT (player_id)
    DO UPDATE SET
      games_played = player_stats.games_played + 1,
      games_won = player_stats.games_won + $2
  `;
  return query(text, [playerId, won ? 1 : 0]);
};
```

## Deployment

### Testing Deployment
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Railway/Vercel auto-deploy
5. Test production deployment

### Rolling Back
```bash
# Revert last commit
git revert HEAD
git push origin main
```

## Pull Request Process

1. **Fork** the repository
2. **Create branch** from `main`
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make changes** and commit
   ```bash
   git commit -m "Add: description of feature"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/my-feature
   ```
5. **Create Pull Request** on GitHub
6. **Wait for review**

### PR Guidelines
- Clear description of changes
- Include screenshots/GIFs if UI changes
- All tests pass
- No console errors
- Tested with 4 players

## Common Tasks

### Add New Game Phase
1. Add phase to `GamePhase` type
2. Add UI component in `frontend/src/components/`
3. Add logic in `backend/src/index.ts`
4. Handle in `frontend/src/App.tsx`

### Change Game Rules
1. Update logic in `backend/src/game/logic.ts`
2. Add/update tests
3. Update README.md game rules section

### Add New Socket Event
1. Add types in both frontend/backend
2. Add handler in backend
3. Add emitter/listener in frontend
4. Document in README API section

## Need Help?

- Check existing code for examples
- Read the Socket.io docs: https://socket.io/docs/
- Ask questions in GitHub issues
- Review closed PRs for similar features

---

Happy coding! 🚀
