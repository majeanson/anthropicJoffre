/**
 * Create Bet Modal Component
 *
 * Modal for creating new side bets (preset or custom).
 * Mobile-friendly design with slider for amount selection.
 */

import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type { PresetBetType, CreateSideBetPayload } from '../types/game';

interface CreateBetModalProps {
  socket: Socket | null;
  gameId: string;
  playerName: string;
  balance: number;
  onClose: () => void;
}

// Preset bet configurations
const PRESET_BETS: {
  type: PresetBetType;
  label: string;
  description: string;
  predictions: { value: string; label: string }[];
}[] = [
  {
    type: 'red_zero_winner',
    label: 'Red 0 Winner',
    description: 'Which team wins the trick with Red 0?',
    predictions: [
      { value: 'team1', label: 'Team 1' },
      { value: 'team2', label: 'Team 2' },
    ],
  },
  {
    type: 'brown_zero_victim',
    label: 'Brown 0 Victim',
    description: 'Which team gets stuck with Brown 0?',
    predictions: [
      { value: 'team1', label: 'Team 1' },
      { value: 'team2', label: 'Team 2' },
    ],
  },
  {
    type: 'bet_made',
    label: 'Bet Made',
    description: 'Will the betting team make their contract?',
    predictions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    type: 'without_trump_success',
    label: 'Without Trump',
    description: 'Will the "without trump" bet succeed?',
    predictions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    type: 'first_trump_played',
    label: 'First Trump',
    description: 'Which team plays the first trump card?',
    predictions: [
      { value: 'team1', label: 'Team 1' },
      { value: 'team2', label: 'Team 2' },
    ],
  },
];

export default function CreateBetModal({
  socket,
  gameId,
  playerName: _playerName, // Reserved for future use
  balance,
  onClose,
}: CreateBetModalProps) {
  void _playerName; // Silence unused warning
  const [betType, setBetType] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PresetBetType | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [amount, setAmount] = useState(Math.min(10, balance));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPresetConfig = PRESET_BETS.find(p => p.type === selectedPreset);
  const maxAmount = balance;
  const minAmount = 1;

  const handleSubmit = useCallback(() => {
    if (!socket) return;

    // Validation
    if (amount < minAmount || amount > maxAmount) {
      setError(`Amount must be between ${minAmount} and ${maxAmount}`);
      return;
    }

    if (betType === 'preset') {
      if (!selectedPreset) {
        setError('Please select a bet type');
        return;
      }
      if (!prediction) {
        setError('Please select a prediction');
        return;
      }
    } else {
      if (!customDescription.trim()) {
        setError('Please enter a bet description');
        return;
      }
      if (customDescription.length > 200) {
        setError('Description must be under 200 characters');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateSideBetPayload = {
      gameId,
      betType,
      amount,
      ...(betType === 'preset'
        ? { presetType: selectedPreset!, prediction }
        : { customDescription: customDescription.trim() }),
    };

    socket.emit('create_side_bet', payload);

    // Close modal after a short delay (socket will handle response)
    setTimeout(() => {
      onClose();
    }, 300);
  }, [
    socket,
    gameId,
    betType,
    selectedPreset,
    prediction,
    customDescription,
    amount,
    minAmount,
    maxAmount,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span>🎲</span>
            Create Bet
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-surface-hover)] rounded transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Balance display */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Your Balance
            </span>
            <span className="text-yellow-500 font-bold flex items-center gap-1">
              <span>🪙</span>
              {balance}
            </span>
          </div>

          {/* Bet type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBetType('preset');
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                betType === 'preset'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              Preset Bets
            </button>
            <button
              onClick={() => {
                setBetType('custom');
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                betType === 'custom'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              Custom Bet
            </button>
          </div>

          {/* Preset bet selection */}
          {betType === 'preset' && (
            <div className="space-y-3">
              <label className="text-sm text-[var(--color-text-secondary)]">
                Select Bet Type
              </label>
              <div className="grid gap-2">
                {PRESET_BETS.map(preset => (
                  <button
                    key={preset.type}
                    onClick={() => {
                      setSelectedPreset(preset.type);
                      setPrediction('');
                    }}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedPreset === preset.type
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {preset.label}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Prediction selection */}
              {selectedPresetConfig && (
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-text-secondary)]">
                    Your Prediction
                  </label>
                  <div className="flex gap-2">
                    {selectedPresetConfig.predictions.map(pred => (
                      <button
                        key={pred.value}
                        onClick={() => setPrediction(pred.value)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          prediction === pred.value
                            ? 'bg-green-500 text-white'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                      >
                        {pred.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom bet input */}
          {betType === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm text-[var(--color-text-secondary)]">
                Describe Your Bet
              </label>
              <textarea
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder="e.g., Marc will play a trump on the first trick"
                maxLength={200}
                className="w-full p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-yellow-500 resize-none"
                rows={3}
              />
              <div className="text-xs text-[var(--color-text-secondary)] text-right">
                {customDescription.length}/200
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Custom bets require manual resolution. If disputed, both players get refunded.
              </p>
            </div>
          )}

          {/* Amount slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-[var(--color-text-secondary)]">
                Bet Amount
              </label>
              <span className="text-yellow-500 font-bold flex items-center gap-1">
                <span>🪙</span>
                {amount}
              </span>
            </div>
            <input
              type="range"
              min={minAmount}
              max={maxAmount}
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>{minAmount}</span>
              <span>{maxAmount}</span>
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2">
              {[10, 25, 50, 100].filter(v => v <= maxAmount).map(quickAmount => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount)}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${
                    amount === quickAmount
                      ? 'bg-yellow-500 text-white'
                      : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {quickAmount}
                </button>
              ))}
              <button
                onClick={() => setAmount(maxAmount)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  amount === maxAmount
                    ? 'bg-yellow-500 text-white'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                All-in
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || balance < minAmount}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : `Bet ${amount} Coins`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
