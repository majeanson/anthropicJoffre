/**
 * UI Components - Barrel Export
 *
 * Centralized export for all reusable UI components.
 * Simplifies imports across the application.
 *
 * Usage:
 * ```tsx
 * import { Modal, Button, Input, Checkbox } from '@/components/ui';
 * ```
 */

// Core Interactive Components
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';

export { HeaderActionButton } from './HeaderActionButton';
export type { HeaderActionButtonProps, HeaderActionButtonSize } from './HeaderActionButton';

// Form Components
export { Input } from './Input';
export type { InputProps, InputVariant, InputSize } from './Input';

export { Checkbox } from './Checkbox';
export type { CheckboxProps, CheckboxVariant, CheckboxSize } from './Checkbox';

export { Select } from './Select';
export type { SelectProps, SelectVariant, SelectSize, SelectOption } from './Select';

export { UIToggle, UIToggleField } from './UIToggle';
export type { UIToggleProps, UIToggleFieldProps, ToggleSize, ToggleColor } from './UIToggle';

export { UISlider, UISliderField } from './UISlider';
export type { UISliderProps, UISliderFieldProps, SliderSize, SliderColor } from './UISlider';

// Navigation Components
export { Tabs, TabPanel } from './Tabs';
export type { TabsProps, TabPanelProps, Tab, TabVariant, TabSize } from './Tabs';

// Feedback Components
export { Alert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';

export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPosition, TooltipVariant } from './Tooltip';

export { GameTooltip, GameTooltipTrigger } from './GameTooltip';
export type { GameTooltipProps, GameTooltipTriggerProps, GameTooltipVariant } from './GameTooltip';

export { Toast } from './Toast';
export type { ToastProps, ToastVariant } from './Toast';

// Loading Components
export {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  StatsGridSkeleton,
  TextBlockSkeleton,
  AvatarTextSkeleton,
  ButtonSkeleton,
} from './Skeleton';

export { ProgressBar } from './ProgressBar';

export { Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerVariant, SpinnerColor } from './Spinner';
export type {
  ProgressBarProps,
  ProgressBarVariant,
  ProgressBarSize,
  ProgressBarColor,
} from './ProgressBar';

// Team Components
export { TeamCard, TeamBadge, TeamIndicator } from './TeamCard';
export type {
  TeamCardProps,
  TeamCardVariant,
  TeamCardSize,
  TeamId,
  TeamBadgeProps,
  TeamIndicatorProps,
} from './TeamCard';

// State Display Components
export { LoadingState, EmptyState, ErrorState, DataState } from './StateDisplay';
export type {
  LoadingStateProps,
  EmptyStateProps,
  EmptyStateAction,
  ErrorStateProps,
  DataStateProps,
} from './StateDisplay';

// Layout components
export { UICard } from './UICard';
export type {
  UICardProps,
  UICardVariant,
  UICardSize,
  UICardPadding,
  UICardGradient,
} from './UICard';

export { UIBadge } from './UIBadge';
export type {
  UIBadgeProps,
  UIBadgeVariant,
  UIBadgeColor,
  UIBadgeSize,
  UIBadgeShape,
} from './UIBadge';

export { UIDivider } from './UIDivider';
export type {
  UIDividerProps,
  DividerOrientation,
  DividerVariant,
  DividerSize,
  DividerColor,
} from './UIDivider';

export { UIDropdownMenu } from './UIDropdownMenu';
export type { UIDropdownMenuProps, DropdownMenuItem, DropdownPosition } from './UIDropdownMenu';

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
