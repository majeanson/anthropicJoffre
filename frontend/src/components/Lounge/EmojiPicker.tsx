/**
 * EmojiPicker - A comprehensive emoji picker for chat reactions
 *
 * Features:
 * - Categorized emoji groups
 * - Recent emojis (persisted in localStorage)
 * - Search functionality
 * - Keyboard navigation
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Emoji categories with common emojis
const EMOJI_CATEGORIES = {
  recent: { label: 'Recent', icon: '🕐', emojis: [] as string[] },
  smileys: {
    label: 'Smileys',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
      '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😳',
      '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
      '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
      '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
    ],
  },
  gestures: {
    label: 'Gestures',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🖐️', '✋', '🤚', '👋', '🤏', '👊',
      '✊', '🤛', '🤜', '🫰', '🫵', '🫱', '🫲', '🫳', '🫴', '🫶',
    ],
  },
  hearts: {
    label: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
      '🫀', '💋', '👄', '💏', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💐', '🌹',
    ],
  },
  activities: {
    label: 'Activities',
    icon: '🎮',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺',
      '🎮', '🕹️', '🎲', '🧩', '♟️', '🎯', '🎳', '🎰', '🎴', '🀄',
    ],
  },
  objects: {
    label: 'Objects',
    icon: '🔥',
    emojis: [
      '🔥', '✨', '💫', '⭐', '🌟', '💥', '💢', '💦', '💨', '🕳️',
      '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎉', '🎊', '🎈',
      '🎁', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🎵', '🎶', '🎤',
      '🎧', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📸', '📹',
      '💡', '🔦', '💰', '💎', '🔑', '🗝️', '🔒', '🔓', '⚙️', '🔧',
    ],
  },
  food: {
    label: 'Food',
    icon: '🍕',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇',
      '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🧀', '🥗', '🥙', '🥪',
      '🌮', '🌯', '🫔', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱',
      '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥮', '🍢', '🍡',
      '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬',
    ],
  },
  nature: {
    label: 'Nature',
    icon: '🌸',
    emojis: [
      '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱',
      '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁',
      '🍂', '🍃', '🪹', '🪺', '🍄', '🐚', '🪨', '🌍', '🌎', '🌏',
      '🌕', '🌙', '⭐', '🌟', '✨', '⚡', '🔥', '🌈', '☀️', '🌤️',
      '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '💨',
    ],
  },
  animals: {
    label: 'Animals',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍',
    ],
  },
};

// Get recent emojis from localStorage
const getRecentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem('recentEmojis');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save recent emojis to localStorage
const saveRecentEmoji = (emoji: string) => {
  try {
    const recent = getRecentEmojis();
    const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, 20);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Get categories with recent emojis populated
  const categories = useMemo(() => ({
    ...EMOJI_CATEGORIES,
    recent: { ...EMOJI_CATEGORIES.recent, emojis: recentEmojis },
  }), [recentEmojis]);

  // Emoji name mappings for search functionality
  const EMOJI_NAMES: Record<string, string[]> = useMemo(() => ({
    // Smileys
    '😀': ['grinning', 'happy', 'smile'],
    '😃': ['smiley', 'happy', 'joy'],
    '😄': ['smile', 'happy', 'laugh'],
    '😁': ['grin', 'happy', 'beam'],
    '😅': ['sweat', 'nervous', 'relief'],
    '😂': ['joy', 'tears', 'laugh', 'crying', 'lol'],
    '🤣': ['rofl', 'laugh', 'rolling'],
    '😊': ['blush', 'happy', 'smile'],
    '😇': ['innocent', 'angel', 'halo'],
    '🙂': ['slight smile', 'okay'],
    '😉': ['wink', 'flirt'],
    '😍': ['heart eyes', 'love', 'crush'],
    '🥰': ['love', 'hearts', 'adore'],
    '😘': ['kiss', 'love', 'blowing kiss'],
    '😋': ['yummy', 'delicious', 'tongue'],
    '😛': ['tongue', 'playful'],
    '😜': ['wink tongue', 'crazy'],
    '🤪': ['zany', 'crazy', 'wild'],
    '🤔': ['thinking', 'hmm', 'consider'],
    '🤨': ['raised eyebrow', 'skeptical'],
    '😐': ['neutral', 'meh'],
    '😑': ['expressionless', 'blank'],
    '😶': ['silent', 'speechless', 'no mouth'],
    '😏': ['smirk', 'suggestive'],
    '😒': ['unamused', 'meh', 'bored'],
    '🙄': ['eye roll', 'whatever', 'annoyed'],
    '😬': ['grimace', 'awkward', 'cringe'],
    '😮': ['surprised', 'wow', 'oh'],
    '😲': ['astonished', 'shocked', 'wow'],
    '😳': ['flushed', 'embarrassed', 'shy'],
    '🥺': ['pleading', 'puppy eyes', 'please'],
    '😢': ['crying', 'sad', 'tear'],
    '😭': ['sobbing', 'crying', 'bawling'],
    '😱': ['scream', 'fear', 'shocked'],
    '😤': ['huffing', 'frustrated', 'angry'],
    '😡': ['angry', 'mad', 'rage'],
    '😠': ['angry', 'grumpy'],
    '🤬': ['cursing', 'swearing', 'angry'],
    '😈': ['devil', 'evil', 'mischief'],
    '💀': ['skull', 'dead', 'dying'],
    '💩': ['poop', 'crap', 'poo'],
    '🤡': ['clown', 'joker'],
    '👻': ['ghost', 'boo', 'spooky'],
    '👽': ['alien', 'ufo', 'extraterrestrial'],
    // Gestures
    '👍': ['thumbs up', 'like', 'yes', 'ok', 'good'],
    '👎': ['thumbs down', 'dislike', 'no', 'bad'],
    '👌': ['ok', 'perfect', 'nice'],
    '✌️': ['peace', 'victory', 'v'],
    '🤞': ['fingers crossed', 'luck', 'hope'],
    '🤟': ['love you', 'rock'],
    '🤘': ['rock', 'metal', 'horns'],
    '👏': ['clap', 'applause', 'bravo'],
    '🙌': ['celebrate', 'hooray', 'hands up'],
    '🤝': ['handshake', 'deal', 'agreement'],
    '🙏': ['pray', 'please', 'thank you', 'namaste'],
    '💪': ['muscle', 'strong', 'flex', 'bicep'],
    '👋': ['wave', 'hello', 'bye', 'hi'],
    '👊': ['fist bump', 'punch'],
    '✊': ['fist', 'power', 'solidarity'],
    // Hearts
    '❤️': ['heart', 'love', 'red heart'],
    '🧡': ['orange heart', 'love'],
    '💛': ['yellow heart', 'love'],
    '💚': ['green heart', 'love'],
    '💙': ['blue heart', 'love'],
    '💜': ['purple heart', 'love'],
    '🖤': ['black heart', 'love', 'dark'],
    '🤍': ['white heart', 'love', 'pure'],
    '💔': ['broken heart', 'heartbreak', 'sad'],
    '💕': ['two hearts', 'love'],
    '💖': ['sparkling heart', 'love'],
    '💘': ['cupid', 'arrow', 'love'],
    '💋': ['kiss', 'lips'],
    // Objects
    '🔥': ['fire', 'hot', 'lit', 'flame'],
    '✨': ['sparkles', 'stars', 'magic', 'new'],
    '⭐': ['star', 'favorite'],
    '🌟': ['glowing star', 'shine'],
    '💥': ['boom', 'explosion', 'collision'],
    '💯': ['hundred', 'perfect', '100'],
    '🎉': ['party', 'celebration', 'tada'],
    '🎊': ['confetti', 'party'],
    '🎁': ['gift', 'present'],
    '🏆': ['trophy', 'winner', 'champion'],
    '🥇': ['gold medal', 'first', 'winner'],
    '🎵': ['music', 'note', 'song'],
    '🎶': ['music', 'notes', 'melody'],
    '💻': ['laptop', 'computer'],
    '📱': ['phone', 'mobile', 'smartphone'],
    '💡': ['idea', 'lightbulb', 'bright'],
    '💰': ['money', 'bag', 'rich'],
    '💎': ['diamond', 'gem', 'precious'],
    '🔑': ['key', 'unlock'],
    // Food
    '🍕': ['pizza', 'food'],
    '🍔': ['burger', 'hamburger', 'food'],
    '🍟': ['fries', 'french fries'],
    '🍦': ['ice cream', 'dessert'],
    '🍰': ['cake', 'dessert', 'birthday'],
    '☕': ['coffee', 'tea', 'hot drink'],
    '🍺': ['beer', 'drink', 'cheers'],
    '🍻': ['beers', 'cheers', 'toast'],
    // Activities
    '⚽': ['soccer', 'football'],
    '🏀': ['basketball'],
    '🎮': ['gaming', 'video game', 'controller'],
    '🎯': ['target', 'bullseye', 'direct hit'],
    '🎲': ['dice', 'game', 'luck'],
    // Animals
    '🐶': ['dog', 'puppy', 'pet'],
    '🐱': ['cat', 'kitty', 'pet'],
    '🐻': ['bear', 'teddy'],
    '🦄': ['unicorn', 'magic'],
    '🐸': ['frog', 'kermit'],
    // Nature
    '🌸': ['cherry blossom', 'flower', 'spring'],
    '🌹': ['rose', 'flower', 'romantic'],
    '🌈': ['rainbow', 'pride', 'colorful'],
    '☀️': ['sun', 'sunny', 'bright'],
    '🌙': ['moon', 'night', 'crescent'],
    '⚡': ['lightning', 'thunder', 'electric', 'zap'],
    '❄️': ['snowflake', 'cold', 'winter'],
  }), []);

  // Filter emojis by search query
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase().trim();
    const allEmojis: string[] = [];

    Object.values(EMOJI_CATEGORIES).forEach(category => {
      if (category.emojis) {
        allEmojis.push(...category.emojis);
      }
    });

    // Filter emojis by name/alias matching
    const matches = allEmojis.filter(emoji => {
      const names = EMOJI_NAMES[emoji];
      if (names) {
        return names.some(name => name.toLowerCase().includes(query));
      }
      // Fallback: include emoji if query matches the emoji itself
      return emoji === query;
    });

    return [...new Set(matches)];
  }, [searchQuery, EMOJI_NAMES]);

  const handleSelect = useCallback((emoji: string) => {
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
    onSelect(emoji);
    onClose();
  }, [onSelect, onClose]);

  const currentEmojis = filteredEmojis || categories[activeCategory as keyof typeof categories]?.emojis || [];

  return (
    <div
      ref={containerRef}
      className="bg-skin-secondary rounded-xl border-2 border-skin-default shadow-xl w-80 max-h-96 flex flex-col overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b border-skin-default">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full px-3 py-1.5 rounded-lg bg-skin-tertiary text-skin-primary text-sm border border-skin-default focus:border-skin-accent focus:outline-none"
        />
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex gap-1 p-1 border-b border-skin-default overflow-x-auto">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`
                p-1.5 rounded-lg text-lg transition-colors flex-shrink-0
                ${activeCategory === key
                  ? 'bg-skin-accent text-skin-inverse'
                  : 'hover:bg-skin-tertiary'
                }
                ${key === 'recent' && recentEmojis.length === 0 ? 'hidden' : ''}
              `}
              title={category.label}
            >
              {category.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {!searchQuery && (
          <div className="text-xs text-skin-muted mb-2 font-medium">
            {categories[activeCategory as keyof typeof categories]?.label || 'Results'}
          </div>
        )}

        {currentEmojis.length === 0 ? (
          <div className="text-center py-4 text-skin-muted text-sm">
            {searchQuery ? 'No emojis found' : 'No recent emojis'}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {currentEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleSelect(emoji)}
                className="p-1.5 text-xl rounded hover:bg-skin-tertiary transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-skin-default text-xs text-skin-muted text-center">
        Click to react • Esc to close
      </div>
    </div>
  );
}

export default EmojiPicker;
