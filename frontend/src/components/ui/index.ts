/**
 * UI Components - Barrel Export
 *
 * Centralized export for all reusable UI components.
 * Simplifies imports across the application.
 *
 * Usage:
 * ```tsx
 * import { Modal, Button, IconButton } from '@/components/ui';
 * ```
 */

export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';

// Social components
export { SocialListItem } from './SocialListItem';
export { OnlineStatusBadge } from './OnlineStatusBadge';
export type { PlayerStatus } from './OnlineStatusBadge';

// Messaging components
export { MessageBubble } from './MessageBubble';
export { ConversationItem } from './ConversationItem';
export { UnreadBadge } from './UnreadBadge';
export type { UnreadBadgeVariant, UnreadBadgeSize, UnreadBadgePosition } from './UnreadBadge';

// Export config for convenience
export { themes, getTheme } from '../../config/themes';
export type { ThemeName, Theme } from '../../config/themes';

export { zIndex, getModalZIndex } from '../../config/zIndex';

export { spacing, sizes, animations, borderRadius, shadows } from '../../config/layout';
