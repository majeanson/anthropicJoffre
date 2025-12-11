/**
 * FormActionButtons Component
 *
 * Reusable Back/Submit button pair for form pages.
 * Provides consistent responsive layout (stacked on mobile, side-by-side on desktop).
 *
 * Used by: GameCreationForm, JoinGameForm, GameWithBotCreationForm
 */

import { forwardRef, RefObject } from 'react';
import { Button } from './Button';
import { sounds } from '../../utils/sounds';

export interface FormActionButtonsProps {
  /** Back button click handler */
  onBack: () => void;
  /** Back button label (default: "Back") */
  backLabel?: string;
  /** Back button icon (default: none) */
  backIcon?: string;
  /** Submit button label */
  submitLabel: string;
  /** Submit button is loading */
  isLoading?: boolean;
  /** Submit button is disabled */
  isDisabled?: boolean;
  /** Submit button variant (default: "success") */
  submitVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Play sound on back click (default: true) */
  playSoundOnBack?: boolean;
  /** Ref for the back button (for keyboard navigation) */
  backButtonRef?: RefObject<HTMLButtonElement>;
  /** Ref for the submit button (for keyboard navigation) */
  submitButtonRef?: RefObject<HTMLButtonElement>;
  /** Test ID prefix (will append -back-button and -submit-button) */
  testIdPrefix?: string;
  /** Additional className for the container */
  className?: string;
}

export const FormActionButtons = forwardRef<HTMLDivElement, FormActionButtonsProps>(
  function FormActionButtons(
    {
      onBack,
      backLabel = 'Back',
      backIcon,
      submitLabel,
      isLoading = false,
      isDisabled = false,
      submitVariant = 'success',
      playSoundOnBack = true,
      backButtonRef,
      submitButtonRef,
      testIdPrefix,
      className = '',
    },
    ref
  ) {
    const handleBack = () => {
      if (playSoundOnBack) {
        sounds.buttonClick();
      }
      onBack();
    };

    return (
      <div
        ref={ref}
        className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${className}`}
      >
        <Button
          ref={backButtonRef}
          data-testid={testIdPrefix ? `${testIdPrefix}-back-button` : 'back-button'}
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleBack}
          className="flex-1"
        >
          {backIcon && <span aria-hidden="true">{backIcon}</span>}
          {backIcon ? ` ${backLabel}` : backLabel}
        </Button>
        <Button
          ref={submitButtonRef}
          data-testid={testIdPrefix ? `${testIdPrefix}-submit-button` : 'submit-button'}
          type="submit"
          variant={submitVariant}
          size="lg"
          className="flex-1"
          loading={isLoading}
          disabled={isDisabled || isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    );
  }
);
