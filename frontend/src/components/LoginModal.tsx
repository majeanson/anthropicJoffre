/**
 * Login Modal Component
 * Sprint 3 Phase 1
 * Migrated to use Storybook Modal and Button components
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';

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
          <Alert variant="error">{error}</Alert>
        )}

        {/* Username/Email Field */}
        <Input
          id="username"
          label="Username or Email"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username or email"
          disabled={isLoading}
          autoComplete="username"
          variant="filled"
          fullWidth
        />

        {/* Password Field */}
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          autoComplete="current-password"
          showPasswordToggle
          variant="filled"
          fullWidth
        />

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
        <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
