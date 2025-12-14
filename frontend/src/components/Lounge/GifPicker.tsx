/**
 * GifPicker - Search and select GIFs from Tenor
 *
 * Uses the Tenor GIF API for searching GIFs.
 * Displays trending GIFs by default, and search results when typing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface GifPickerProps {
  onSelect: (gif: { url: string; thumbnailUrl: string; altText: string }) => void;
  onClose: () => void;
}

interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif: { url: string };
    tinygif: { url: string };
    nanogif: { url: string };
  };
}

// Tenor API key - get one at https://developers.google.com/tenor/guides/quickstart
// Uses environment variable if available, otherwise falls back to demo key
const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'AIzaSyDDPUkK-dRc_RoYr3tpH0oXPMBJaI3nGBg';
const TENOR_CLIENT_KEY = import.meta.env.VITE_TENOR_CLIENT_KEY || 'jaffre_lounge';

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch trending GIFs on mount
  useEffect(() => {
    fetchTrending();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=20&media_filter=gif,tinygif,nanogif`
      );
      if (!response.ok) throw new Error('Failed to fetch GIFs');
      const data = await response.json();
      setGifs(data.results || []);
    } catch (err) {
      setError('Failed to load GIFs');
      console.error('Tenor API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTrending();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif,tinygif,nanogif`
      );
      if (!response.ok) throw new Error('Failed to search GIFs');
      const data = await response.json();
      setGifs(data.results || []);
    } catch (err) {
      setError('Failed to search GIFs');
      console.error('Tenor API error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchGifs(value);
    }, 300);
  };

  const handleSelectGif = (gif: TenorGif) => {
    onSelect({
      url: gif.media_formats.gif?.url || gif.media_formats.tinygif?.url,
      thumbnailUrl: gif.media_formats.nanogif?.url || gif.media_formats.tinygif?.url,
      altText: gif.title || 'GIF',
    });
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-skin-secondary rounded-xl border-2 border-skin-default shadow-2xl z-30 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-skin-default">
        <div className="flex items-center gap-2">
          <span className="text-lg">GIF</span>
          <span className="text-xs text-skin-muted">Powered by Tenor</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-skin-tertiary text-skin-muted hover:text-skin-primary"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-skin-default">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full px-3 py-2 rounded-lg bg-skin-tertiary text-skin-primary placeholder-skin-muted border border-skin-default focus:border-skin-accent focus:outline-none text-sm"
          autoFocus
        />
      </div>

      {/* GIF Grid */}
      <div className="p-2 max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-skin-accent border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-skin-muted">
            <p>{error}</p>
            <button
              onClick={fetchTrending}
              className="mt-2 text-sm text-skin-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="text-center py-8 text-skin-muted text-sm">
            No GIFs found
          </div>
        )}

        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleSelectGif(gif)}
                className="aspect-square rounded-lg overflow-hidden bg-skin-tertiary hover:ring-2 hover:ring-skin-accent transition-all"
              >
                <img
                  src={gif.media_formats.nanogif?.url || gif.media_formats.tinygif?.url}
                  alt={gif.title || 'GIF'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GifPicker;
