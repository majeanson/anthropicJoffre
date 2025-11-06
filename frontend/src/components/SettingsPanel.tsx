/**
 * Enhanced Settings Panel with Tabs
 * Sprint 3 Phase 3.6
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { ConnectionQualityBadge } from './ConnectionQualityIndicator';

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
  const { darkMode, setDarkMode, animationsEnabled, setAnimationsEnabled, debugMode, setDebugMode } = useSettings();
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

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'settings', label: 'Settings', icon: '⚙️' },
    { key: 'advanced', label: 'Advanced', icon: '🔧' },
  ];

  const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
      title={`${enabled ? 'Disable' : 'Enable'} ${label}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-3">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-dark-mode">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{darkMode ? '🌙' : '☀️'}</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Dark Mode</span>
              </div>
              <ToggleSwitch enabled={darkMode} onChange={() => setDarkMode(!darkMode)} label="Dark Mode" />
            </div>

            {/* Sound Toggle */}
            {onSoundToggle && (
              <div className="flex items-center justify-between" data-testid="settings-sound">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Sound</span>
                </div>
                <ToggleSwitch enabled={soundEnabled} onChange={onSoundToggle} label="Sound" />
              </div>
            )}

            {/* Animations Toggle */}
            <div className="flex items-center justify-between" data-testid="settings-animations">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Animations</span>
              </div>
              <ToggleSwitch enabled={animationsEnabled} onChange={() => setAnimationsEnabled(!animationsEnabled)} label="Animations" />
            </div>

            {/* Autoplay Toggle */}
            {!isSpectator && onAutoplayToggle && (
              <div className="flex items-center justify-between" data-testid="settings-autoplay">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{autoplayEnabled ? '⚡' : '🎮'}</span>
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Autoplay</span>
                </div>
                <ToggleSwitch enabled={autoplayEnabled} onChange={onAutoplayToggle} label="Autoplay" />
              </div>
            )}

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

            {/* Divider */}
            <div className="border-t border-amber-700/30 dark:border-gray-600"></div>

            {/* Rules Button */}
            {onOpenRules && (
              <button
                onClick={handleRules}
                className="w-full bg-parchment-200 dark:bg-gray-700 hover:bg-parchment-300 dark:hover:bg-gray-600 border border-amber-700 dark:border-gray-600 rounded px-3 py-2 transition-colors flex items-center gap-2"
                data-testid="settings-rules"
              >
                <span className="text-2xl">📖</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">How to Play</span>
              </button>
            )}

            {/* Bot Management Button */}
            {!isSpectator && onOpenBotManagement && (
              <button
                onClick={handleBotManagement}
                className="w-full bg-parchment-200 dark:bg-gray-700 hover:bg-parchment-300 dark:hover:bg-gray-600 border border-amber-700 dark:border-gray-600 rounded px-3 py-2 transition-colors flex items-center justify-between"
                data-testid="settings-bot-management"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span className="text-umber-900 dark:text-gray-100 font-semibold">Bot Management</span>
                </div>
                <span className="text-umber-700 dark:text-gray-300 text-sm">({botCount}/3)</span>
              </button>
            )}

            {/* Leave Game Button */}
            {onLeaveGame && (
              <>
                <div className="border-t border-amber-700/30 dark:border-gray-600"></div>
                <button
                  onClick={handleLeaveGame}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-3 rounded transition-all shadow-md flex items-center justify-center gap-2"
                  data-testid="settings-leave-game"
                >
                  <span className="text-2xl">🚪</span>
                  <span>Leave Game</span>
                </button>
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

            {/* Debug Mode */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐛</span>
                  <span className="text-umber-900 dark:text-gray-100 text-sm font-semibold">Debug Mode</span>
                </div>
                <ToggleSwitch enabled={debugMode} onChange={() => setDebugMode(!debugMode)} label="Debug Mode" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                Shows game state inspector and enables multi-player view for testing
              </p>
            </div>

            {/* Clear Cache Button */}
            <div className="border-t border-amber-700/30 dark:border-gray-600"></div>
            <button
              onClick={() => {
                localStorage.clear();
                alert('Cache cleared! The page will reload.');
                window.location.reload();
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="text-xl">🗑️</span>
              <span>Clear Cache</span>
            </button>
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
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 transition-colors text-xl font-bold"
            title="Close Settings"
            data-testid="settings-close-button"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-700/30 dark:border-gray-600">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 transition-colors ${
                activeTab === tab.key
                  ? 'bg-parchment-200 dark:bg-gray-700 border-b-2 border-amber-700 dark:border-blue-500'
                  : 'hover:bg-parchment-200/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className={`text-sm font-medium ${
                activeTab === tab.key
                  ? 'text-umber-900 dark:text-gray-100'
                  : 'text-umber-700 dark:text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </>,
    document.body
  );
}