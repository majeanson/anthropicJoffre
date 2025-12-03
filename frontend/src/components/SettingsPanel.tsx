/**
 * Enhanced Settings Panel with Tabs
 * Sprint 3 Phase 3.6
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useSkin } from '../contexts/SkinContext';
import { SkinId } from '../config/skins';
import { CardSkinId } from '../config/cardSkins';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { ConnectionQualityBadge } from './ConnectionQualityIndicator';
import { Button, UIToggle, UIDivider, Tabs, Tab, Select } from './ui';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  botCount?: number;
  onOpenBotManagement?: () => void;
  onLeaveGame?: () => void;
  onOpenRules?: () => void;
  isSpectator?: boolean;
  connectionStats?: ConnectionStats;
}

type SettingsTab = 'settings' | 'preferences' | 'advanced';

export function SettingsPanel({
  isOpen,
  onClose,
  soundEnabled = true,
  onSoundToggle,
  autoplayEnabled = false,
  onAutoplayToggle,
  botCount = 0,
  onOpenBotManagement,
  onLeaveGame,
  onOpenRules,
  isSpectator = false,
  connectionStats
}: SettingsPanelProps) {
  const { animationsEnabled, setAnimationsEnabled, beginnerMode, setBeginnerMode } = useSettings();
  const { skinId, setSkin, availableSkins, cardSkinId, setCardSkin, availableCardSkins, isCardSkinUnlocked, getCardSkinRequiredLevel, playerLevel } = useSkin();
  const [activeTab, setActiveTab] = useState<SettingsTab>('settings');

  if (!isOpen) return null;

  const handleBotManagement = () => {
    onClose();
    onOpenBotManagement?.();
  };

  const handleLeaveGame = () => {
    onClose();
    onLeaveGame?.();
  };

  const handleRules = () => {
    onClose();
    onOpenRules?.();
  };

  const settingsTabs: Tab[] = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'preferences', label: 'Theme', icon: '🎨' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
  ];

  // Convert skins to Select options (skin names already include emoji indicators)
  const skinOptions = availableSkins.map(skin => ({
    value: skin.id,
    label: skin.name,
  }));

  // Convert card skins to Select options with lock indicators
  const cardSkinOptions = availableCardSkins.map(cardSkin => {
    const isLocked = !isCardSkinUnlocked(cardSkin.id);
    const requiredLevel = getCardSkinRequiredLevel(cardSkin.id);
    return {
      value: cardSkin.id,
      label: isLocked ? `🔒 ${cardSkin.name} (Lvl ${requiredLevel})` : cardSkin.name,
      disabled: isLocked,
    };
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-3">
            {/* Sound Toggle */}
            {onSoundToggle && (
              <div className="flex items-center justify-between" data-testid="settings-sound">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">Sound</span>
                </div>
                <UIToggle enabled={soundEnabled} onChange={() => onSoundToggle()} label="Sound" />
              </div>
            )}

            {/* Beginner Mode Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-beginner-mode">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">Beginner Mode</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] ml-8">
                  Tutorial tips + 2x timeout (120s)
                </span>
              </div>
              <UIToggle enabled={beginnerMode} onChange={(v) => setBeginnerMode(v)} label="Beginner Mode" />
            </div>

            {/* Autoplay Toggle */}
            {!isSpectator && onAutoplayToggle && (
              <div className="flex items-center justify-between" data-testid="settings-autoplay">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{autoplayEnabled ? '⚡' : '🎮'}</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">Autoplay</span>
                </div>
                <UIToggle enabled={autoplayEnabled} onChange={() => onAutoplayToggle()} label="Autoplay" />
              </div>
            )}

            {/* Divider */}
            <UIDivider color="amber" spacing="none" />

            {/* Rules Button */}
            {onOpenRules && (
              <Button
                onClick={handleRules}
                variant="ghost"
                size="md"
                fullWidth
                className="justify-start"
                data-testid="settings-rules"
              >
                <span className="text-2xl">📖</span>
                <span>How to Play</span>
              </Button>
            )}

            {/* Leave Game Button */}
            {onLeaveGame && (
              <>
                <UIDivider color="amber" spacing="none" />
                <Button
                  onClick={handleLeaveGame}
                  variant="danger"
                  fullWidth
                  data-testid="settings-leave-game"
                >
                  <span className="text-2xl">🚪</span>
                  <span>Leave Game</span>
                </Button>
              </>
            )}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Customize the visual appearance
            </p>

            {/* Skin/Theme Selector */}
            <div data-testid="settings-skin">
              <Select
                label="Visual Theme"
                options={skinOptions}
                value={skinId}
                onChange={(e) => setSkin(e.target.value as SkinId)}
                fullWidth
                variant="arcane"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-1">
                {availableSkins.find(s => s.id === skinId)?.description}
              </p>
            </div>

            {/* Card Skin Selector */}
            <div data-testid="settings-card-skin">
              <Select
                label="Card Style"
                options={cardSkinOptions}
                value={cardSkinId}
                onChange={(e) => {
                  const newId = e.target.value as CardSkinId;
                  if (isCardSkinUnlocked(newId)) {
                    setCardSkin(newId);
                  }
                }}
                fullWidth
                variant="arcane"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-1">
                {availableCardSkins.find(s => s.id === cardSkinId)?.description}
                {playerLevel < 30 && (
                  <span className="block mt-1 text-[var(--color-text-accent)]">
                    Level up to unlock more card styles!
                  </span>
                )}
              </p>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-animations-pref">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-[var(--color-text-primary)] font-semibold">Animations</span>
              </div>
              <UIToggle enabled={animationsEnabled} onChange={(v) => setAnimationsEnabled(v)} label="Animations" />
            </div>

            {/* Sound Toggle (if available) */}
            {onSoundToggle && (
              <div className="flex items-center justify-between" data-testid="settings-sound-pref">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">Sound</span>
                </div>
                <UIToggle enabled={soundEnabled} onChange={() => onSoundToggle()} label="Sound" />
              </div>
            )}
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Advanced settings for power users
            </p>

            {/* Connection Quality */}
            {connectionStats && (
              <div className="flex items-center justify-between" data-testid="settings-connection">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📡</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">Connection</span>
                </div>
                <ConnectionQualityBadge stats={connectionStats} />
              </div>
            )}

            {/* Bot Management Button */}
            {!isSpectator && onOpenBotManagement && (
              <Button
                onClick={handleBotManagement}
                variant="ghost"
                size="md"
                fullWidth
                className="justify-between"
                data-testid="settings-bot-management"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span>Bot Management</span>
                </div>
                <span className="text-[var(--color-text-secondary)] text-sm">({botCount}/3)</span>
              </Button>
            )}

            {/* Divider */}
            <UIDivider color="amber" spacing="none" />

            {/* Clear Cache Button */}
            <Button
              onClick={() => {
                localStorage.clear();
                alert('Cache cleared! The page will reload.');
                window.location.reload();
              }}
              variant="warning"
              fullWidth
            >
              <span className="text-xl">🗑️</span>
              <span>Clear Cache</span>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[10000] transition-opacity"
        onClick={onClose}
        data-testid="settings-backdrop"
      />

      {/* Settings Panel - Increased width for tabs, positioned above chat on mobile */}
      <div
        className="fixed bottom-20 right-4 sm:bottom-4 md:bottom-6 md:right-6 border-2 rounded-lg shadow-2xl z-[10001] w-full sm:w-[420px] max-w-[calc(100vw-2rem)] animate-slide-in"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-accent)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="settings-panel"
      >
        {/* Header */}
        <div
          className="px-4 py-2 rounded-t-md border-b-2 flex items-center justify-between"
          style={{
            background: `linear-gradient(to right, var(--color-bg-accent), color-mix(in srgb, var(--color-bg-accent) 80%, var(--color-text-accent)))`,
            borderColor: 'var(--color-border-accent)',
          }}
        >
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-inverse)' }}>
            <span>⚙️</span>
            <span>Settings</span>
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="hover:opacity-80"
            style={{ color: 'var(--color-text-inverse)' }}
            title="Close Settings"
            data-testid="settings-close-button"
          >
            ✕
          </Button>
        </div>

        {/* Tab Navigation */}
        <Tabs
          tabs={settingsTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as SettingsTab)}
          variant="underline"
          size="sm"
          fullWidth
          className="border-b border-[var(--color-border-default)]"
        />

        {/* Tab Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </>,
    document.body
  );
}