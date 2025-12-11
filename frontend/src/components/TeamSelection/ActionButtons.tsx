/**
 * ActionButtons Component
 *
 * Renders the add bot and start game buttons with validation message.
 */

import { memo, RefObject } from 'react';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';

interface ActionButtonsProps {
  /** Whether to show the add bot button */
  showAddBot: boolean;
  /** Whether the game can be started */
  canStartGame: boolean;
  /** Message explaining why game can't start */
  startGameMessage: string;
  /** Callback when add bot is clicked */
  onAddBot?: () => void;
  /** Callback when start game is clicked */
  onStartGame: () => void;
  /** Ref for add bot button (keyboard navigation) */
  addBotButtonRef?: RefObject<HTMLButtonElement>;
  /** Ref for start game button (keyboard navigation) */
  startGameButtonRef?: RefObject<HTMLButtonElement>;
}

function ActionButtonsComponent({
  showAddBot,
  canStartGame,
  startGameMessage,
  onAddBot,
  onStartGame,
  addBotButtonRef,
  startGameButtonRef,
}: ActionButtonsProps) {
  return (
    <div className="text-center space-y-4">
      {/* Action buttons */}
      <div className="flex gap-3 justify-center items-center flex-wrap">
        {showAddBot && onAddBot && (
          <Button
            ref={addBotButtonRef}
            onClick={() => {
              sounds.buttonClick();
              onAddBot();
            }}
            variant="warning"
            size="md"
          >
            🤖 Add Bot
          </Button>
        )}

        <Button
          ref={startGameButtonRef}
          data-testid={canStartGame ? 'start-game-button' : 'start-game-button-disabled'}
          onClick={
            canStartGame
              ? () => {
                  sounds.gameStart();
                  onStartGame();
                }
              : undefined
          }
          disabled={!canStartGame}
          variant="success"
          size="lg"
        >
          🎮 Start Game
        </Button>
      </div>

      {/* Start game validation message */}
      {!canStartGame && startGameMessage && (
        <div
          className="
            p-3
            rounded-[var(--radius-md)]
            border border-[var(--color-warning)]
            bg-[var(--color-warning)]/10
            max-w-md mx-auto
          "
        >
          <p data-testid="start-game-message" className="text-sm font-body text-skin-warning">
            {startGameMessage}
          </p>
        </div>
      )}
    </div>
  );
}

export const ActionButtons = memo(ActionButtonsComponent);
