/**
 * useLobbyGames Hook
 *
 * Manages fetching and state for active and recent games.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/constants';
import { ERROR_MESSAGES, getErrorMessage } from '../../config/errorMessages';
import logger from '../../utils/logger';
import { LobbyGame, RecentGame, LobbyBrowserTabType } from './types';

interface UseLobbyGamesOptions {
  activeTab: LobbyBrowserTabType;
}

interface UseLobbyGamesReturn {
  games: LobbyGame[];
  recentGames: RecentGame[];
  loading: boolean;
  error: string | null;
  correlationId: string | null;
  isRetrying: boolean;
  refreshGames: () => void;
}

export function useLobbyGames({ activeTab }: UseLobbyGamesOptions): UseLobbyGamesReturn {
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Track if we've done the initial load for each tab
  const hasLoadedActiveGames = useRef(false);
  const hasLoadedRecentGames = useRef(false);

  const fetchGames = useCallback(async (isInitialLoad = false, retryCount = 0) => {
    try {
      if (isInitialLoad && !hasLoadedActiveGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.gamesLobby(), {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        if (response.status >= 500 && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchGames(isInitialLoad, retryCount + 1);
        }

        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setGames(data.games);
      setError(null);
      setCorrelationId(null);
      hasLoadedActiveGames.current = true;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        logger.error('[LobbyBrowser] Network error:', err);
        setError(ERROR_MESSAGES.NETWORK_ERROR);

        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        logger.error('[LobbyBrowser] Failed to load games:', errorMessage, { error: String(err) });
        setError(`${ERROR_MESSAGES.GAMES_LOAD_FAILED}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  const fetchRecentGames = useCallback(async (isInitialLoad = false, retryCount = 0) => {
    try {
      if (isInitialLoad && !hasLoadedRecentGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.recentGames(), {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        if (response.status >= 500 && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }

        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setRecentGames(data.games);
      setError(null);
      setCorrelationId(null);
      hasLoadedRecentGames.current = true;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const errorMessage = 'Network error. Please check your connection.';
        logger.error('[LobbyBrowser] Network error:', err);
        setError(errorMessage);

        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        logger.error('[LobbyBrowser] Failed to load recent games:', errorMessage, {
          error: String(err),
        });
        setError(`${ERROR_MESSAGES.RECENT_GAMES_LOAD_FAILED}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'active') {
      fetchGames(true);
      const interval = setInterval(() => fetchGames(false), 5000);
      return () => clearInterval(interval);
    } else {
      fetchRecentGames(true);
    }
  }, [activeTab, fetchGames, fetchRecentGames]);

  const refreshGames = useCallback(() => {
    if (activeTab === 'active') {
      fetchGames(true);
    } else {
      fetchRecentGames(true);
    }
  }, [activeTab, fetchGames, fetchRecentGames]);

  return {
    games,
    recentGames,
    loading,
    error,
    correlationId,
    isRetrying,
    refreshGames,
  };
}
