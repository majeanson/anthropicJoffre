/**
 * useLobbyFilters Hook
 *
 * Manages filter and sort state for the lobby browser.
 * Provides filtered and sorted games list.
 */

import { useState, useMemo } from 'react';
import { LobbyGame, GameModeFilter, SortOption } from './types';

interface UseLobbyFiltersReturn {
  // Filter state
  filterWithBots: boolean;
  setFilterWithBots: (value: boolean) => void;
  filterNeedsPlayers: boolean;
  setFilterNeedsPlayers: (value: boolean) => void;
  filterInProgress: boolean;
  setFilterInProgress: (value: boolean) => void;
  filterGameMode: GameModeFilter;
  setFilterGameMode: (value: GameModeFilter) => void;
  // Sort state
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  // Filtered results
  getFilteredGames: (games: LobbyGame[]) => LobbyGame[];
}

export function useLobbyFilters(): UseLobbyFiltersReturn {
  // Filter state
  const [filterWithBots, setFilterWithBots] = useState(false);
  const [filterNeedsPlayers, setFilterNeedsPlayers] = useState(false);
  const [filterInProgress, setFilterInProgress] = useState(false);
  const [filterGameMode, setFilterGameMode] = useState<GameModeFilter>('all');

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter and sort function
  const getFilteredGames = useMemo(() => {
    return (games: LobbyGame[]) => {
      let filtered = [...games];

      if (filterWithBots) {
        filtered = filtered.filter((game) => game.botPlayerCount > 0);
      }
      if (filterNeedsPlayers) {
        filtered = filtered.filter((game) => game.humanPlayerCount < 4 || game.botPlayerCount > 0);
      }
      if (filterInProgress) {
        filtered = filtered.filter((game) => game.isInProgress);
      }
      if (filterGameMode === 'ranked') {
        filtered = filtered.filter((game) => game.persistenceMode === 'elo');
      } else if (filterGameMode === 'casual') {
        filtered = filtered.filter((game) => game.persistenceMode === 'casual');
      }

      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.createdAt - a.createdAt;
          case 'players':
            return b.humanPlayerCount - a.humanPlayerCount;
          case 'score':
            const aScore = a.teamScores.team1 + a.teamScores.team2;
            const bScore = b.teamScores.team1 + b.teamScores.team2;
            return bScore - aScore;
          default:
            return 0;
        }
      });

      return filtered;
    };
  }, [filterWithBots, filterNeedsPlayers, filterInProgress, filterGameMode, sortBy]);

  return {
    filterWithBots,
    setFilterWithBots,
    filterNeedsPlayers,
    setFilterNeedsPlayers,
    filterInProgress,
    setFilterInProgress,
    filterGameMode,
    setFilterGameMode,
    sortBy,
    setSortBy,
    getFilteredGames,
  };
}
