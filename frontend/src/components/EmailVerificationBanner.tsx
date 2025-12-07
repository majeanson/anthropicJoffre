/**
 * Email Verification Banner Component
 * Sprint 3 Phase 1
 *
 * Shows a banner when user is logged in but email is not verified
 */

import { useAuth } from '../contexts/AuthContext';
import { UICard } from './ui/UICard';

export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth();

  // Don't show if not authenticated or already verified
  if (!isAuthenticated || !user || user.is_verified) {
    return null;
  }

  return (
    <UICard
      variant="bordered"
      size="sm"
      gradient="warning"
      className="text-center border-b-2 border-yellow-500 rounded-none"
    >
      <div className="flex items-center justify-center gap-2 text-skin-warning">
        <span className="text-xl">⚠️</span>
        <p className="text-sm font-semibold">
          Your email is not verified. Please check your inbox for the verification link.
        </p>
      </div>
    </UICard>
  );
}
