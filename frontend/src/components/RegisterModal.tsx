/**
 * Register Modal Component
 * Sprint 3 Phase 1
 * Migrated to use Storybook Modal and Button components
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  // All hooks MUST be called before any conditional returns (Rules of Hooks)
  const { register, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debug: Track if state is being reset
  const prevUsernameRef = React.useRef(username);
  const prevEmailRef = React.useRef(email);
  const prevPasswordRef = React.useRef(password);

  React.useEffect(() => {
    if (prevUsernameRef.current && !username) {
      logger.error('[RegisterModal] USERNAME WAS CLEARED!', {
        prev: prevUsernameRef.current,
        current: username,
        stack: new Error().stack,
      });
    }
    if (prevEmailRef.current && !email) {
      logger.error('[RegisterModal] EMAIL WAS CLEARED!', {
        prev: prevEmailRef.current,
        current: email,
        stack: new Error().stack,
      });
    }
    if (prevPasswordRef.current && !password) {
      logger.error('[RegisterModal] PASSWORD WAS CLEARED!', {
        prev: prevPasswordRef.current.length + ' chars',
        current: password.length + ' chars',
        stack: new Error().stack,
      });
    }

    prevUsernameRef.current = username;
    prevEmailRef.current = email;
    prevPasswordRef.current = password;
  });

  // Password strength indicator
  const getPasswordStrength = (
    pwd: string
  ): { strength: string; color: string; percentage: number } => {
    if (pwd.length === 0) return { strength: '', color: 'bg-skin-muted', percentage: 0 };
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
        display_name: displayName.trim() || undefined,
      });

      // Success
      setSuccessMessage(
        'Account created successfully! Please check your email to verify your account.'
      );

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Account"
      icon="📝"
      theme="purple"
      size="sm"
      ariaLabel="Create new account"
      testId="register-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {/* Error Message */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Username Field */}
        <Input
          id="username"
          label="Username *"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="3-50 characters, letters, numbers, _, -"
          disabled={isLoading || !!successMessage}
          autoComplete="username"
          minLength={3}
          maxLength={50}
          error={
            username && username.length < 3 ? 'Username must be at least 3 characters' : undefined
          }
          variant="filled"
          fullWidth
        />

        {/* Email Field */}
        <Input
          id="email"
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isLoading || !!successMessage}
          autoComplete="email"
          variant="filled"
          fullWidth
        />

        {/* Display Name Field */}
        <Input
          id="displayName"
          label="Display Name (Optional)"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to appear (defaults to username)"
          disabled={isLoading || !!successMessage}
          maxLength={100}
          variant="filled"
          fullWidth
        />

        {/* Password Field */}
        <div>
          <Input
            id="password"
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
            disabled={isLoading || !!successMessage}
            autoComplete="new-password"
            minLength={8}
            showPasswordToggle
            variant="filled"
            fullWidth
          />
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-skin-muted">Password Strength:</span>
                <span
                  className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}
                >
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-skin-tertiary">
                <div
                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <Input
          id="confirmPassword"
          label="Confirm Password *"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          disabled={isLoading || !!successMessage}
          autoComplete="new-password"
          showPasswordToggle
          error={
            confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined
          }
          variant="filled"
          fullWidth
        />

        {/* Register Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!isFormValid || !!successMessage}
        >
          Create Account
        </Button>

        {/* Login Link */}
        <div className="text-center pt-4 border-t border-skin-default">
          <p className="text-sm text-skin-muted">
            Already have an account?{' '}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onSwitchToLogin}
              disabled={isLoading || !!successMessage}
            >
              Login here
            </Button>
          </p>
        </div>
      </form>
    </Modal>
  );
}
