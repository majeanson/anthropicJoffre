/**
 * GameCreationForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game creation UI with player name input and persistence mode selection
 */

import { useState } from 'react';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName, createGamePersistence);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
      </div>

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 dark:border-gray-600 relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-6 text-umber-900 dark:text-gray-100 font-serif text-center">Create Game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
              Your Name
            </label>
            <input
              data-testid="player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100"
              placeholder={user ? "Using authenticated username" : "Enter your name"}
              disabled={!!user}
              required
            />
          </div>

          {/* Persistence Mode Selector */}
          <div className="bg-parchment-100 dark:bg-gray-800 border-2 border-umber-300 dark:border-gray-600 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  data-testid="persistence-mode-checkbox"
                  type="checkbox"
                  checked={createGamePersistence === 'elo'}
                  onChange={(e) => setCreateGamePersistence(e.target.checked ? 'elo' : 'casual')}
                  className="w-4 h-4 text-umber-600 dark:text-purple-600 bg-parchment-50 dark:bg-gray-700 border-umber-300 dark:border-gray-500 rounded focus:ring-umber-500 dark:focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-umber-800 dark:text-gray-200">
                  Ranked Mode
                </span>
              </label>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                createGamePersistence === 'elo'
                  ? 'bg-amber-200 dark:bg-purple-900 text-amber-900 dark:text-purple-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {createGamePersistence === 'elo' ? '🏆 Ranked' : '🎮 Casual'}
              </span>
            </div>
            <p className="text-xs text-umber-600 dark:text-gray-400 mt-2">
              {createGamePersistence === 'elo'
                ? 'Game will be saved to your profile and affect your ranking'
                : 'No stats saved - play without affecting your ELO rating'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              data-testid="back-button"
              type="button"
              onClick={() => { sounds.buttonClick(); onBack(); }}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
            >
              Back
            </button>
            <button
              data-testid="submit-create-button"
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
