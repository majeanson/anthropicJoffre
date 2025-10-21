import { createContext, useContext, useState, ReactNode } from 'react';
import { GameState } from '../types/game';

interface GameContextType {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  gameId: string;
  setGameId: (id: string) => void;
  isSpectator: boolean;
  setIsSpectator: (isSpectator: boolean) => void;
  currentTrickWinnerId: string | null;
  setCurrentTrickWinnerId: (id: string | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [currentTrickWinnerId, setCurrentTrickWinnerId] = useState<string | null>(null);

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        gameId,
        setGameId,
        isSpectator,
        setIsSpectator,
        currentTrickWinnerId,
        setCurrentTrickWinnerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
