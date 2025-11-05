/**
 * Register Modal Component
 * Sprint 3 Phase 1
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  // Early return BEFORE hooks
  if (!isOpen) return null;

  const { register, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: string; color: string; percentage: number } => {
    if (pwd.length === 0) return { strength: '', color: 'bg-gray-600', percentage: 0 };
    if (pwd.length < 8) return { strength: 'Weak', color: 'bg-red-500', percentage: 25 };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { strength: 'Weak', color: 'bg-red-500', percentage: 40 };
    if (score === 3) return { strength: 'Fair', color: 'bg-yellow-500', percentage: 60 };
    if (score === 4) return { strength: 'Good', color: 'bg-green-500', percentage: 80 };
    return { strength: 'Strong', color: 'bg-green-600', percentage: 100 };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    // Validation
    if (!username.trim() || !email.trim() || !password) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username,
        email,
        password,
        display_name: displayName.trim() || undefined
      });

      // Success
      setSuccessMessage('Account created successfully! Please check your email to verify your account.');

      // Clear form only on success
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');

      // Switch to login after 3 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Don't clear form fields on close - user might want to continue
    clearError();
    setSuccessMessage('');
    onClose();
  };

  const isFormValid =
    username.trim().length >= 3 &&
    email.trim().includes('@') &&
    password.length >= 8 &&
    password === confirmPassword;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={handleClose}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500/30 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📝</span>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
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
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              placeholder="3-50 characters, letters, numbers, _, -"
              disabled={isLoading || !!successMessage}
              autoComplete="username"
              minLength={3}
              maxLength={50}
            />
            {username && username.length < 3 && (
              <p className="text-xs text-yellow-400 mt-1">Username must be at least 3 characters</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              placeholder="your@email.com"
              disabled={isLoading || !!successMessage}
              autoComplete="email"
            />
          </div>

          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-300 mb-2">
              Display Name (Optional)
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              placeholder="How you want to appear (defaults to username)"
              disabled={isLoading || !!successMessage}
              maxLength={100}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none pr-12"
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                disabled={isLoading || !!successMessage}
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading || !!successMessage}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Password Strength:</span>
                  <span className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              placeholder="Re-enter your password"
              disabled={isLoading || !!successMessage}
              autoComplete="new-password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid || !!successMessage}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                disabled={isLoading || !!successMessage}
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
