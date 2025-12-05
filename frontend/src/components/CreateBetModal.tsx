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
  playerTeamId: 1 | 2;
  isWithoutTrump?: boolean;
  isSpectator?: boolean;
  balance: number;
  onClose: () => void;
}

// Preset bet configurations - predictions use 'myTeam'/'theirTeam' which get mapped to team1/team2 based on player's team
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
      { value: 'myTeam', label: 'My Team' },
      { value: 'theirTeam', label: 'Their Team' },
    ],
  },
  {
    type: 'brown_zero_victim',
    label: 'Brown 0 Victim',
    description: 'Which team gets stuck with Brown 0?',
    predictions: [
      { value: 'myTeam', label: 'My Team' },
      { value: 'theirTeam', label: 'Their Team' },
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
      { value: 'myTeam', label: 'My Team' },
      { value: 'theirTeam', label: 'Their Team' },
    ],
  },
];

export default function CreateBetModal({
  socket,
  gameId,
  playerName: _playerName, // Reserved for future use
  playerTeamId,
  isWithoutTrump = false,
  isSpectator = false,
  balance,
  onClose,
}: CreateBetModalProps) {
  void _playerName; // Silence unused warning

  // Helper to convert myTeam/theirTeam to actual team values
  // For spectators, use team1/team2 directly since they have no team
  const mapPredictionToTeam = (pred: string): string => {
    if (isSpectator) {
      // Spectators bet on team1 or team2 directly
      if (pred === 'myTeam') return 'team1';
      if (pred === 'theirTeam') return 'team2';
    } else {
      if (pred === 'myTeam') return `team${playerTeamId}`;
      if (pred === 'theirTeam') return `team${playerTeamId === 1 ? 2 : 1}`;
    }
    return pred; // For 'true'/'false' predictions, return as-is
  };

  // Helper to get prediction label (spectators see Team 1/Team 2)
  const getPredictionLabel = (value: string, label: string): string => {
    if (isSpectator) {
      if (value === 'myTeam') return 'Team 1';
      if (value === 'theirTeam') return 'Team 2';
    }
    return label;
  };

  // Filter preset bets based on game state
  // - "Without Trump" bet only available when the round is played without trump
  // - "First Trump" bet only available when there IS a trump suit
  const availablePresetBets = PRESET_BETS.filter(bet => {
    if (bet.type === 'without_trump_success') return isWithoutTrump;
    if (bet.type === 'first_trump_played') return !isWithoutTrump;
    return true;
  });
  const [betType, setBetType] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PresetBetType | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [resolutionTiming, setResolutionTiming] = useState<'trick' | 'round' | 'game' | 'manual'>('manual');
  const [amount, setAmount] = useState(Math.min(10, balance));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution timing options for custom bets
  const RESOLUTION_TIMING_OPTIONS = [
    { value: 'trick' as const, label: 'After This Trick', description: 'Resolve when current trick ends' },
    { value: 'round' as const, label: 'End of Round', description: 'Resolve when this round ends' },
    { value: 'game' as const, label: 'End of Game', description: 'Resolve when the game ends' },
    { value: 'manual' as const, label: 'Manual', description: 'Participants decide the winner' },
  ];

  const selectedPresetConfig = availablePresetBets.find(p => p.type === selectedPreset);
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
        ? { presetType: selectedPreset!, prediction: mapPredictionToTeam(prediction) }
        : { customDescription: customDescription.trim(), resolutionTiming }),
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
    resolutionTiming,
    amount,
    minAmount,
    maxAmount,
    onClose,
    mapPredictionToTeam,
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
        className="relative w-full max-w-md bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border-default)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)] bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span>🎲</span>
            Create Bet
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Balance display */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
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
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
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
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
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
                {availablePresetBets.map(preset => (
                  <button
                    key={preset.type}
                    onClick={() => {
                      setSelectedPreset(preset.type);
                      setPrediction('');
                    }}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedPreset === preset.type
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)]'
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
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
                        }`}
                      >
                        {getPredictionLabel(pred.value, pred.label)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom bet input */}
          {betType === 'custom' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-text-secondary)]">
                  Describe Your Bet
                </label>
                <textarea
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="e.g., Marc will play a trump on the first trick"
                  maxLength={200}
                  className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-yellow-500 resize-none"
                  rows={3}
                />
                <div className="text-xs text-[var(--color-text-secondary)] text-right">
                  {customDescription.length}/200
                </div>
              </div>

              {/* Resolution timing */}
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-text-secondary)]">
                  When to Resolve
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_TIMING_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setResolutionTiming(option.value)}
                      className={`p-2 text-left rounded-lg border transition-colors ${
                        resolutionTiming === option.value
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {option.label}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)]">
                {resolutionTiming === 'manual'
                  ? 'Participants will decide the winner. If disputed, both players get refunded.'
                  : `You will be reminded to resolve this bet ${
                      resolutionTiming === 'trick'
                        ? 'when the current trick ends'
                        : resolutionTiming === 'round'
                        ? 'at the end of this round'
                        : 'when the game ends'
                    }.`}
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
              className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
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
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
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
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
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
        <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] font-medium rounded-lg transition-colors"
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
