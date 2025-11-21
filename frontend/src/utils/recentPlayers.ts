// Recent Players Management
// Tracks players you've recently played with in localStorage

export interface RecentPlayer {
  name: string;
  lastPlayed: number;
  gamesPlayed: number;
}

const RECENT_PLAYERS_KEY = 'recentPlayers';
const MAX_RECENT_PLAYERS = 20;

/**
 * Get list of recent players from localStorage
 */
export function getRecentPlayers(): RecentPlayer[] {
  try {
    const data = localStorage.getItem(RECENT_PLAYERS_KEY);
    if (!data) return [];

    const players: RecentPlayer[] = JSON.parse(data);

    // Sort by most recent first
    return players.sort((a, b) => b.lastPlayed - a.lastPlayed);
  } catch (e) {
    logger.error('Failed to load recent players:', e);
    return [];
  }
}

/**
 * Add a player to recent players list
 * Updates games played count if player already exists
 */
export function addRecentPlayer(playerName: string): void {
  if (!playerName || playerName.trim() === '') return;

  const players = getRecentPlayers();
  const existing = players.find(p => p.name === playerName);

  if (existing) {
    // Update existing player
    existing.lastPlayed = Date.now();
    existing.gamesPlayed++;
  } else {
    // Add new player
    players.push({
      name: playerName,
      lastPlayed: Date.now(),
      gamesPlayed: 1
    });
  }

  // Keep only the most recent MAX_RECENT_PLAYERS
  const trimmed = players
    .sort((a, b) => b.lastPlayed - a.lastPlayed)
    .slice(0, MAX_RECENT_PLAYERS);

  try {
    localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    logger.error('Failed to save recent players:', e);
  }
}

/**
 * Add multiple players at once (e.g., after a game ends)
 * Excludes your own name
 */
export function addRecentPlayers(playerNames: string[], yourName: string): void {
  playerNames.forEach(name => {
    if (name !== yourName) {
      addRecentPlayer(name);
    }
  });
}

/**
 * Clear all recent players
 */
export function clearRecentPlayers(): void {
  try {
    localStorage.removeItem(RECENT_PLAYERS_KEY);
  } catch (e) {
    logger.error('Failed to clear recent players:', e);
  }
}
