/**
 * MessagesTab Component
 *
 * Simple button to open Direct Messages panel.
 * Part of SocialPanel.
 */

import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';
import { User } from '../../types/auth';

interface MessagesTabProps {
  user: User | null;
  unreadDMCount: number;
  onOpenMessages: () => void;
}

export function MessagesTab({ user, unreadDMCount, onOpenMessages }: MessagesTabProps) {
  if (!user) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-16">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-lg font-semibold">Login Required</p>
        <p className="text-sm mt-2">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <Button
        onClick={() => {
          sounds.buttonClick();
          onOpenMessages();
        }}
        variant="primary"
        size="lg"
      >
        💬 Open Direct Messages
        {unreadDMCount > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {unreadDMCount} new
          </span>
        )}
      </Button>
      <p className="text-sm text-[var(--color-text-secondary)] mt-4">
        Send private messages to friends and recent players
      </p>
    </div>
  );
}
