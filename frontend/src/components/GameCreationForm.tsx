/**
 * GameCreationForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game creation UI with player name input and persistence mode selection
 * Uses shared keyboard navigation and layout components
 */

import { useState, useRef, useCallback } from 'react';
import { User } from '../types/auth';
import { UIBadge, Input, Checkbox, FormPageLayout, FormActionButtons } from './ui';
import { useFormKeyboardNav } from '../hooks/useFormKeyboardNav';

interface GameCreationFormProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  onCreateGame: (playerName: string, persistenceMode?: 'elo' | 'casual') => void;
  onBack: () => void;
  user: User | null;
}

export function GameCreationForm({
  playerName,
  setPlayerName,
  onCreateGame,
  onBack,
  user,
}: GameCreationFormProps) {
  const [createGamePersistence, setCreateGamePersistence] = useState<'elo' | 'casual'>('elo');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for focusable elements
  const nameInputRef = useRef<HTMLInputElement>(null);
  const rankedCheckboxRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Grid config: Row 0=name, Row 1=checkbox, Row 2=buttons
  // Skip row 0 if authenticated
  const getFocusableElement = useCallback(
    (row: number, col: number): HTMLElement | null => {
      const effectiveRow = user ? row + 1 : row;
      switch (effectiveRow) {
        case 0:
          return nameInputRef.current;
        case 1:
          return rankedCheckboxRef.current;
        case 2:
          return col === 0 ? backButtonRef.current : createButtonRef.current;
        default:
          return null;
      }
    },
    [user]
  );

  // Use shared keyboard navigation hook
  useFormKeyboardNav({
    grid: {
      colsPerRow: [1, 1, 2], // name, checkbox, buttons
      skipRows: user ? 1 : 0,
    },
    getFocusableElement,
    onEscape: onBack,
    inputRefs: [nameInputRef],
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (playerName.trim()) {
      setIsLoading(true);
      onCreateGame(playerName, createGamePersistence);
    }
  };

  return (
    <FormPageLayout title="Create Game">
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          ref={nameInputRef}
          id="playerName"
          data-testid="player-name-input"
          label="Your Name"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder={user ? 'Using authenticated username' : 'Enter your name'}
          disabled={!!user}
          required
          variant="default"
          fullWidth
        />

        {/* Persistence Mode Selector */}
        <div
          className={`bg-skin-secondary border-2 border-skin-default rounded-lg p-3 ${!user ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center justify-between gap-3">
            <Checkbox
              ref={rankedCheckboxRef}
              id="persistenceMode"
              data-testid="persistence-mode-checkbox"
              label="Ranked Mode"
              checked={createGamePersistence === 'elo'}
              onChange={(e) => setCreateGamePersistence(e.target.checked ? 'elo' : 'casual')}
              disabled={!user}
              size="sm"
            />
            <UIBadge
              variant="solid"
              color={createGamePersistence === 'elo' ? 'warning' : 'gray'}
              size="sm"
            >
              <span aria-hidden="true">{createGamePersistence === 'elo' ? '🏆' : '🎮'}</span>{' '}
              {createGamePersistence === 'elo' ? 'Ranked' : 'Casual'}
            </UIBadge>
          </div>
          <p className="text-xs text-skin-muted mt-2">
            {!user ? (
              <>
                <span aria-hidden="true">🔒</span> Available when registered - Register to enable
                ranked mode
              </>
            ) : createGamePersistence === 'elo' ? (
              'Game will be saved to your profile and affect your ranking'
            ) : (
              'No stats saved - play without affecting your ELO rating'
            )}
          </p>
        </div>

        <FormActionButtons
          onBack={onBack}
          submitLabel="Create"
          isLoading={isLoading}
          backButtonRef={backButtonRef}
          submitButtonRef={createButtonRef}
        />
      </form>
    </FormPageLayout>
  );
}
