/**
 * ProfileActions - Friend, block, and view stats buttons
 */

import { Button } from '../ui/Button';
import { UICard } from '../ui/UICard';
import type { ProfileActionsProps } from './types';

export function ProfileActions({
  isAuthenticated,
  isOwnProfile,
  friendStatus,
  blockStatus,
  sendingRequest,
  blockingInProgress,
  onSendFriendRequest,
  onRemoveFriend,
  onBlockPlayer,
  onUnblockPlayer,
  onViewFullStats,
  onShowWhyRegister,
  onClose,
}: ProfileActionsProps) {
  return (
    <div className="space-y-2">
      {/* View Full Stats Button */}
      {onViewFullStats && (
        <Button
          variant="primary"
          fullWidth
          onClick={onViewFullStats}
          leftIcon={<span>📊</span>}
        >
          View Full Statistics
        </Button>
      )}

      {/* Friend Actions - Only show if authenticated and not own profile */}
      {isAuthenticated && !isOwnProfile && (
        <>
          {/* Show blocked by them notice */}
          {blockStatus.blockedByThem && (
            <UICard variant="gradient" gradient="warning" size="sm" className="text-center">
              <p className="text-sm text-yellow-100">This player has blocked you</p>
            </UICard>
          )}

          {/* Friend buttons - only if not blocked either way */}
          {!blockStatus.isBlocked && !blockStatus.blockedByThem && (
            <>
              {friendStatus === 'none' && (
                <Button
                  variant="success"
                  fullWidth
                  onClick={onSendFriendRequest}
                  disabled={sendingRequest}
                  loading={sendingRequest}
                  leftIcon={!sendingRequest ? <span>➕</span> : undefined}
                >
                  {sendingRequest ? 'Sending...' : 'Add Friend'}
                </Button>
              )}
              {friendStatus === 'pending' && (
                <Button variant="secondary" fullWidth disabled leftIcon={<span>⏳</span>}>
                  Friend Request Pending
                </Button>
              )}
              {friendStatus === 'friends' && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={onRemoveFriend}
                  leftIcon={<span>🗑️</span>}
                >
                  Remove Friend
                </Button>
              )}
            </>
          )}

          {/* Block/Unblock Button */}
          <div className="pt-2 border-t border-skin-default">
            {blockStatus.isBlocked ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={onUnblockPlayer}
                disabled={blockingInProgress}
                loading={blockingInProgress}
                leftIcon={!blockingInProgress ? <span>🔓</span> : undefined}
              >
                {blockingInProgress ? 'Unblocking...' : 'Unblock Player'}
              </Button>
            ) : (
              <Button
                variant="danger"
                fullWidth
                onClick={onBlockPlayer}
                disabled={blockingInProgress}
                loading={blockingInProgress}
                leftIcon={!blockingInProgress ? <span>🚫</span> : undefined}
              >
                {blockingInProgress ? 'Blocking...' : 'Block Player'}
              </Button>
            )}
          </div>
        </>
      )}

      {/* Guest prompt */}
      {!isAuthenticated && !isOwnProfile && (
        <UICard variant="gradient" gradient="info" size="sm" className="text-center">
          <p className="text-sm text-blue-100 mb-3">
            Sign in to add friends and send messages
          </p>
          {onShowWhyRegister && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onShowWhyRegister();
              }}
              leftIcon={<span>🚀</span>}
            >
              Why should I register?
            </Button>
          )}
        </UICard>
      )}
    </div>
  );
}
