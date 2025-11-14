import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock AudioContext for testing (not available in jsdom)
const MockAudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn(),
}));

(globalThis as typeof globalThis & { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

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
