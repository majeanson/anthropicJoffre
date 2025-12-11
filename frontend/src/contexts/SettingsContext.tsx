import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sounds } from '../utils/sounds';

interface SettingsContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  autoplayEnabled: boolean;
  setAutoplayEnabled: (enabled: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  environmentEnabled: boolean;
  setEnvironmentEnabled: (enabled: boolean) => void;
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  debugPanelOpen: boolean;
  setDebugPanelOpen: (open: boolean) => void;
  testPanelOpen: boolean;
  setTestPanelOpen: (open: boolean) => void;
  beginnerMode: boolean;
  setBeginnerMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('animationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [environmentEnabled, setEnvironmentEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('environmentEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);

  const [beginnerMode, setBeginnerModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('beginnerMode');
    return saved !== null ? JSON.parse(saved) : true; // Default to true for new users
  });

  // Sync sound settings
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Sync animations settings
  useEffect(() => {
    localStorage.setItem('animationsEnabled', JSON.stringify(animationsEnabled));
  }, [animationsEnabled]);

  // Sync environment effects settings
  useEffect(() => {
    localStorage.setItem('environmentEnabled', JSON.stringify(environmentEnabled));
  }, [environmentEnabled]);

  // Sync beginner mode settings
  useEffect(() => {
    localStorage.setItem('beginnerMode', JSON.stringify(beginnerMode));
  }, [beginnerMode]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.setEnabled(enabled);
    if (enabled) {
      sounds.buttonClick(); // Play test sound when enabling
    }
  };

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
  };

  const setEnvironmentEnabled = (enabled: boolean) => {
    setEnvironmentEnabledState(enabled);
  };

  const setBeginnerMode = (enabled: boolean) => {
    setBeginnerModeState(enabled);
  };

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        autoplayEnabled,
        setAutoplayEnabled,
        animationsEnabled,
        setAnimationsEnabled,
        environmentEnabled,
        setEnvironmentEnabled,
        debugMode,
        setDebugMode,
        debugPanelOpen,
        setDebugPanelOpen,
        testPanelOpen,
        setTestPanelOpen,
        beginnerMode,
        setBeginnerMode,
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
