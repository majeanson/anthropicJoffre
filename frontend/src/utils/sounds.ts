// Sound utility for game audio effects using Web Audio API
// Generates simple synthesized sounds without requiring audio files

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.3; // Default volume (0-1)

  constructor() {
    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    // Resume context if suspended (due to browser autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  // Card dealing sound - soft whoosh with pitch variation
  playCardDeal(index: number = 0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Oscillator for swoosh sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch varies slightly for each card
    const basePitch = 200 + (index * 10);
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 0.5, now + 0.1);

    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Card play sound - satisfying click/snap
  playCardPlay() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Sharp click sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Sprint 1 Phase 2: Card play confirmation - pitch varies by card value
  playCardConfirm(cardValue: number = 5) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Base frequency varies by card value (0-7)
    // Higher cards = higher pitch
    const basePitch = 400 + (cardValue * 80); // 400-960 Hz range

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 1.2, now + 0.05);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Trick won sound - triumphant chime
  playTrickWon() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Three-note ascending chord
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(freq, now);

      const delay = i * 0.05;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  }

  // Trick collection sound - descending cascade with multiple tones
  playTrickCollect() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Three descending notes for a "gathering" effect
    const frequencies = [880, 660, 440]; // A5, E5, A4

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const delay = i * 0.08;
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + delay + 0.2);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  // Round start sound - pleasant chime
  playRoundStart() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Bell-like sound
    const frequencies = [523.25, 659.25]; // C, E

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(this.masterVolume * 0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.6);
    });
  }

  // Button click sound - subtle click
  playButtonClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Your turn notification - attention-grabbing beep (Sprint 1 Phase 5: Enhanced)
  playYourTurn() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Three ascending beeps for better attention-grabbing effect
    [0, 0.12, 0.24].forEach((delay, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Ascending pitch pattern (A5, C6, E6) - musical chord
      const frequencies = [880, 1046, 1318];
      osc.frequency.setValueAtTime(frequencies[index], now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }

  // Chat notification - friendly pop sound
  playChatNotification() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Gentle ascending pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(600, now); // Starting frequency
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08); // Quick rise

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Sprint 1 Phase 6: Additional sound effects

  // Bet placed - coin clink sound
  playBetPlaced() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Metallic clink with overtones
    [1, 1.5, 2, 2.5].forEach((multiplier, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(400 * multiplier, now);
      osc.frequency.exponentialRampToValueAtTime(350 * multiplier, now + 0.1);

      const volume = this.masterVolume * 0.15 * (1 / (index + 1));
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    });
  }

  // Bet skipped - whoosh sound
  playBetSkipped() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Descending whoosh
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Team switch - quick boop
  playTeamSwitch() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(700, now + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Game start - fanfare
  playGameStart() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Ascending fanfare: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = index * 0.1;

      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  // Game over - celebratory chord
  playGameOver() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Major chord: C4, E4, G4
    const chord = [261.63, 329.63, 392.00];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, now + 0.05);
      gain.gain.setValueAtTime(this.masterVolume * 0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  // Tap feedback - ultra-quick haptic-like sound for mobile
  playTap() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Very quick tap - almost haptic-like
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

    gain.gain.setValueAtTime(this.masterVolume * 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  // Error - descending error tone
  playError() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Two descending beeps
    [0, 0.15].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(400, now + delay);
      osc.frequency.exponentialRampToValueAtTime(200, now + delay + 0.1);

      gain.gain.setValueAtTime(this.masterVolume * 0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Export individual sound functions for convenience
export const sounds = {
  cardDeal: (index?: number) => soundManager.playCardDeal(index),
  cardPlay: () => soundManager.playCardPlay(),
  cardConfirm: (cardValue?: number) => soundManager.playCardConfirm(cardValue), // Sprint 1 Phase 2
  trickWon: () => soundManager.playTrickWon(),
  trickCollect: () => soundManager.playTrickCollect(),
  roundStart: () => soundManager.playRoundStart(),
  buttonClick: () => soundManager.playButtonClick(),
  tap: () => soundManager.playTap(), // Sprint 20: Mobile tap feedback
  yourTurn: () => soundManager.playYourTurn(),
  chatNotification: () => soundManager.playChatNotification(),
  // Sprint 1 Phase 6: Additional sounds
  betPlaced: () => soundManager.playBetPlaced(),
  betSkipped: () => soundManager.playBetSkipped(),
  teamSwitch: () => soundManager.playTeamSwitch(),
  gameStart: () => soundManager.playGameStart(),
  gameOver: () => soundManager.playGameOver(),
  error: () => soundManager.playError(),
  setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
  setVolume: (volume: number) => soundManager.setVolume(volume),
  isEnabled: () => soundManager['enabled'],
  getVolume: () => soundManager['masterVolume'],
};
