/**
 * Login Modal Component
 * Sprint 3 Phase 1
 * Migrated to use Storybook Modal and Button components
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToPasswordReset: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSwitchToPasswordReset }: LoginModalProps) {
  // All hooks MUST be called before any conditional returns (Rules of Hooks)
  const { login, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!username.trim() || !password) {
      return;
    }

    setIsLoading(true);
    try {
      await login({ username, password });
      // Success - close modal
      onClose();
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    clearError();
    setUsername('');
    setPassword('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Login"
      icon="🔐"
      theme="blue"
      size="sm"
      ariaLabel="Login to your account"
      testId="login-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Username/Email Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
            Username or Email
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="Enter your username or email"
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none pr-12"
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span aria-hidden="true">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onSwitchToPasswordReset}
            disabled={isLoading}
          >
            Forgot password?
          </Button>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!username.trim() || !password}
        >
          Login
        </Button>

        {/* Register Link */}
        <div className="text-center pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Register here
            </Button>
          </p>
        </div>
      </form>
    </Modal>
  );
}
