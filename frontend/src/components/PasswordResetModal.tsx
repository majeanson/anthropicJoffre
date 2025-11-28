/**
 * Password Reset Modal Component
 * Sprint 3 Phase 1
 */

import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { colors } from '../design-system';

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

  // Early return AFTER all hooks (Rules of Hooks)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onKeyDown={(e) => e.stopPropagation()}>
      <div
        style={{
          background: `linear-gradient(to bottom right, ${colors.primary.start}, ${colors.primaryDark.end})`,
          borderColor: colors.warning.border
        }}
        className="rounded-lg shadow-2xl border-2 w-full max-w-md animate-scale-in"
      >

        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🔑</span>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                style={!(isLoading || !email.trim()) ? {
                  background: `linear-gradient(to right, ${colors.warning.start}, ${colors.warning.end})`
                } : undefined}
                className="w-full py-3 text-white font-bold rounded transition-all hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-100 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </>
          )}

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{ color: colors.warning.end }}
              className="hover:opacity-80 font-semibold transition-all text-sm focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
              disabled={isLoading}
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
