/**
 * Password Reset Modal Component
 * Sprint 3 Phase 1
 * Migrated to use Storybook Modal and Button components
 */

import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}


export default function PasswordResetModal({ isOpen, onClose, onSwitchToLogin }: PasswordResetModalProps) {
  // All hooks MUST be called before any conditional returns (Rules of Hooks)
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.authForgotPassword(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request password reset');
      }

      setSuccessMessage(result.message);
      setEmail('');

      // Switch to login after 5 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request password reset';
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      icon="🔑"
      theme="blue"
      size="sm"
      ariaLabel="Reset your password"
      testId="password-reset-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500 rounded p-3 text-green-200 text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-200 text-sm">
            {errorMessage}
          </div>
        )}

        {!successMessage && (
          <>
            <p className="text-gray-300 text-sm">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none"
                placeholder="your@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="warning"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!email.trim()}
            >
              Send Reset Instructions
            </Button>
          </>
        )}

        {/* Back to Login Link */}
        <div className="text-center pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            leftIcon={<span>←</span>}
          >
            Back to Login
          </Button>
        </div>
      </form>
    </Modal>
  );
}
