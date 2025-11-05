/**
 * Avatar Component
 * Sprint 3 Phase 2
 *
 * Displays user avatar with fallback to initials
 */

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
    xl: 'w-24 h-24 text-2xl'
  };

  // Get initials from username (first 2 characters)
  const getInitials = (name: string): string => {
    return name.substring(0, 2).toUpperCase();
  };

  // Generate consistent color based on username
  const getColorFromUsername = (name: string): string => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-amber-500 to-amber-600',
    ];

    // Use first character code to pick color
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (avatarUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 ${className}`}>
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
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
