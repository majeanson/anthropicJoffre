/**
 * Avatar Component
 * Sprint 3 Phase 2
 *
 * Displays user avatar with fallback to initials
 */

import { getAvatarUrl } from '../utils/avatars';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ username, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const emojiSizeClasses = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  // Get initials from username (first 2 characters)
  const getInitials = (name: string): string => {
    return name.substring(0, 2).toUpperCase();
  };

  // Generate consistent color based on username
  const getColorFromUsername = (name: string): string => {
    const gradientOptions = [
      'from-red-500 to-rose-600',
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-purple-400 to-indigo-500',
      'from-orange-400 to-amber-500',
      'from-blue-400 to-cyan-500',
      'from-amber-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-blue-600 to-indigo-700',
      'from-gray-500 to-gray-700',
    ];

    // Use first character code to pick color
    const index = name.charCodeAt(0) % gradientOptions.length;
    return gradientOptions[index];
  };

  // Check if avatarUrl is an emoji or avatar ID
  const isEmoji = (str: string): boolean => {
    // Emojis typically have high Unicode code points
    const codePoint = str.codePointAt(0);
    return codePoint !== undefined && codePoint > 127;
  };

  // Check if avatarUrl is a URL (starts with http or /)
  const isUrl = (str: string): boolean => {
    return str.startsWith('http') || str.startsWith('/');
  };

  if (avatarUrl) {
    // If it's an emoji, display it directly
    if (isEmoji(avatarUrl)) {
      return (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 ${className}`}
        >
          <span className={emojiSizeClasses[size]}>{avatarUrl}</span>
        </div>
      );
    }

    // If it's a URL, load as image
    if (isUrl(avatarUrl)) {
      return (
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 ${className}`}
        >
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    // Otherwise, treat it as an avatar ID and convert to emoji
    const emoji = getAvatarUrl(avatarUrl);
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 ${className}`}
      >
        <span className={emojiSizeClasses[size]}>{emoji}</span>
      </div>
    );
  }

  // Fallback to initials with gradient background
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br ${getColorFromUsername(username)} border-2 border-gray-300 dark:border-gray-600 ${className}`}
    >
      {getInitials(username)}
    </div>
  );
}
