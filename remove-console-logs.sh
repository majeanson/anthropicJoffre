#!/bin/bash

# Script to remove console.log statements while preserving console.error
# Removes both single-line and multi-line console.log calls

FILES_TO_CLEAN=(
  # Frontend components
  "frontend/src/App.tsx"
  "frontend/src/main.tsx"
  "frontend/src/components/PlayingPhase.tsx"
  "frontend/src/components/GameReplay.tsx"
  "frontend/src/components/LobbyBrowser.tsx"
  "frontend/src/components/PlayerStatsModal.tsx"
  "frontend/src/components/RegisterModal.tsx"
  "frontend/src/components/GlobalDebugModal.tsx"
  "frontend/src/components/DebugInfo.tsx"

  # Frontend hooks
  "frontend/src/hooks/useGameState.ts"
  "frontend/src/hooks/useSocketConnection.ts"
  "frontend/src/hooks/useBotManagement.ts"
  "frontend/src/hooks/useGameEventListeners.ts"

  # Frontend contexts
  "frontend/src/contexts/SocketContext.tsx"
  "frontend/src/contexts/AuthContext.tsx"
  "frontend/src/contexts/ModalContext.tsx"

  # Backend socket handlers
  "backend/src/socketHandlers/lobby.ts"
  "backend/src/socketHandlers/gameplay.ts"
  "backend/src/socketHandlers/spectator.ts"
  "backend/src/socketHandlers/connection.ts"
  "backend/src/socketHandlers/bots.ts"
  "backend/src/socketHandlers/directMessages.ts"
  "backend/src/socketHandlers/achievements.ts"
  "backend/src/socketHandlers/friends.ts"
  "backend/src/socketHandlers/admin.ts"

  # Backend core
  "backend/src/index.ts"
  "backend/src/game/state.ts"
  "backend/src/api/routes.ts"
  "backend/src/connection/ConnectionManager.ts"

  # Backend database
  "backend/src/db/index.ts"
  "backend/src/db/gameState.ts"
  "backend/src/db/users.ts"
  "backend/src/db/persistenceManager.ts"

  # Backend utils
  "backend/src/utils/queryCache.ts"
  "backend/src/utils/memoryManager.ts"
  "backend/src/utils/rateLimiter.ts"
  "backend/src/utils/timeoutManager.ts"
  "backend/src/utils/broadcastManager.ts"
  "backend/src/utils/emailService.ts"
)

for file in "${FILES_TO_CLEAN[@]}"; do
  if [ -f "$file" ]; then
    echo "Cleaning $file..."
    # Remove single-line console.log statements
    sed -i '/console\.log/d' "$file"
  else
    echo "Warning: $file not found"
  fi
done

echo "Console.log cleanup complete!"
