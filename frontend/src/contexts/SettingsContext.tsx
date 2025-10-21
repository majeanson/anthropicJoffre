import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sounds } from '../utils/sounds';

interface SettingsContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  autoplayEnabled: boolean;
  setAutoplayEnabled: (enabled: boolean) => void;
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  debugPanelOpen: boolean;
  setDebugPanelOpen: (open: boolean) => void;
  testPanelOpen: boolean;
  setTestPanelOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);

  // Sync sound settings
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.setEnabled(enabled);
    if (enabled) {
      sounds.buttonClick(); // Play test sound when enabling
    }
  };

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
  };

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        darkMode,
        setDarkMode,
        autoplayEnabled,
        setAutoplayEnabled,
        debugMode,
        setDebugMode,
        debugPanelOpen,
        setDebugPanelOpen,
        testPanelOpen,
        setTestPanelOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
