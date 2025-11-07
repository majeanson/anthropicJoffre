import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock AudioContext for testing (not available in jsdom)
(globalThis as any).AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 0 },
  })),
  destination: {},
  currentTime: 0,
})) as any;

// Mock sounds module
vi.mock('../utils/sounds', () => ({
  sounds: {
    buttonClick: vi.fn(),
    cardPlay: vi.fn(),
    trickWon: vi.fn(),
    roundWon: vi.fn(),
    gameWon: vi.fn(),
    betPlaced: vi.fn(),
    notification: vi.fn(),
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    isEnabled: vi.fn(() => true),
    getVolume: vi.fn(() => 1.0),
  },
}));
