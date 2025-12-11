/**
 * usePlayerSearch Hook
 *
 * Manages player search functionality with socket communication.
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../../types/auth';

interface PlayerSearchResult {
  player_name: string;
  games_played: number;
  games_won: number;
}

interface UsePlayerSearchOptions {
  socket: Socket | null;
  user: User | null;
}

interface UsePlayerSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: PlayerSearchResult[];
  setSearchResults: (results: PlayerSearchResult[]) => void;
  isSearching: boolean;
  handleSearch: () => void;
}

export function usePlayerSearch({
  socket,
  user,
}: UsePlayerSearchOptions): UsePlayerSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    if (!socket || !user || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    socket.emit('search_players', { searchQuery: searchQuery.trim() });
  }, [socket, user, searchQuery]);

  // Listen for search results
  useEffect(() => {
    if (!socket) return;

    const handleSearchResults = ({
      players,
    }: {
      players: PlayerSearchResult[];
    }) => {
      const humanPlayers = players.filter((p) => !p.player_name.startsWith('Bot '));
      setSearchResults(humanPlayers);
      setIsSearching(false);
    };

    socket.on('player_search_results', handleSearchResults);

    return () => {
      socket.off('player_search_results', handleSearchResults);
    };
  }, [socket]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    handleSearch,
  };
}
