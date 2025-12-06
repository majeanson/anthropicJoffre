/**
 * Modal Context
 * Prevents modals from being unmounted and losing state
 * Keeps all modals mounted but hidden when not in use
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  // Modal visibility states
  showLoginModal: boolean;
  showRegisterModal: boolean;
  showPasswordResetModal: boolean;

  // Modal control functions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  openPasswordResetModal: () => void;
  closePasswordResetModal: () => void;

  // Switch between modals
  switchToLogin: () => void;
  switchToRegister: () => void;
  switchToPasswordReset: () => void;

  // Close all modals
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  // Keep all modal states here
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  // Modal control functions
  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowPasswordResetModal(false);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowPasswordResetModal(false);
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
  };

  const openPasswordResetModal = () => {
    setShowPasswordResetModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const closePasswordResetModal = () => {
    setShowPasswordResetModal(false);
  };

  // Switch functions (close others, open target)
  const switchToLogin = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowPasswordResetModal(false);
  };

  const switchToRegister = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowPasswordResetModal(false);
  };

  const switchToPasswordReset = () => {
    setShowPasswordResetModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const closeAllModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowPasswordResetModal(false);
  };

  const value: ModalContextType = {
    showLoginModal,
    showRegisterModal,
    showPasswordResetModal,
    openLoginModal,
    closeLoginModal,
    openRegisterModal,
    closeRegisterModal,
    openPasswordResetModal,
    closePasswordResetModal,
    switchToLogin,
    switchToRegister,
    switchToPasswordReset,
    closeAllModals,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
}
