/**
 * Enhanced Settings Panel with Tabs
 * Sprint 3 Phase 3.6
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { ConnectionQualityBadge } from './ConnectionQualityIndicator';
import { Button, UIToggle, UIDivider, Tabs, Tab } from './ui';

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

type SettingsTab = 'settings' | 'advanced';

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
  const { darkMode, setDarkMode, animationsEnabled, setAnimationsEnabled, beginnerMode, setBeginnerMode } = useSettings();
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
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
  ];

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
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Sound</span>
                </div>
                <UIToggle enabled={soundEnabled} onChange={() => onSoundToggle()} label="Sound" />
              </div>
            )}

            {/* Beginner Mode Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-beginner-mode">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Beginner Mode</span>
                </div>
                <span className="text-xs text-umber-600 dark:text-gray-400 ml-8">
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
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Autoplay</span>
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

      case 'advanced':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Advanced settings for power users
            </p>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-dark-mode">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{darkMode ? '🌙' : '☀️'}</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Dark Mode</span>
              </div>
              <UIToggle enabled={darkMode} onChange={(v) => setDarkMode(v)} label="Dark Mode" />
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-animations">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Animations</span>
              </div>
              <UIToggle enabled={animationsEnabled} onChange={(v) => setAnimationsEnabled(v)} label="Animations" />
            </div>

            {/* Connection Quality */}
            {connectionStats && (
              <div className="flex items-center justify-between" data-testid="settings-connection">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📡</span>
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Connection</span>
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
                <span className="text-umber-700 dark:text-gray-300 text-sm">({botCount}/3)</span>
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
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
        data-testid="settings-backdrop"
      />

      {/* Settings Panel - Increased width for tabs */}
      <div
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-parchment-100 dark:bg-gray-800 border-2 border-amber-700 dark:border-gray-600 rounded-lg shadow-2xl z-[9999] w-[420px] max-w-[calc(100vw-2rem)] animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="settings-panel"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 px-4 py-2 rounded-t-md border-b-2 border-amber-800 dark:border-gray-600 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span>⚙️</span>
            <span>Settings</span>
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="!text-white hover:!text-red-300"
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
          className="border-b border-amber-700/30 dark:border-gray-600"
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