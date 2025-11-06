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

  // Debug: Log when ModalProvider re-renders
  console.log('[ModalProvider] Render, states:', { showLoginModal, showRegisterModal, showPasswordResetModal });

  // Modal control functions
  const openLoginModal = () => {
    console.log('[ModalContext] Opening login modal');
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowPasswordResetModal(false);
  };

  const closeLoginModal = () => {
    console.log('[ModalContext] Closing login modal');
    setShowLoginModal(false);
  };

  const openRegisterModal = () => {
    console.log('[ModalContext] Opening register modal');
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowPasswordResetModal(false);
  };

  const closeRegisterModal = () => {
    console.log('[ModalContext] Closing register modal');
    setShowRegisterModal(false);
  };

  const openPasswordResetModal = () => {
    console.log('[ModalContext] Opening password reset modal');
    setShowPasswordResetModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const closePasswordResetModal = () => {
    console.log('[ModalContext] Closing password reset modal');
    setShowPasswordResetModal(false);
  };

  // Switch functions (close others, open target)
  const switchToLogin = () => {
    console.log('[ModalContext] Switching to login');
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowPasswordResetModal(false);
  };

  const switchToRegister = () => {
    console.log('[ModalContext] Switching to register');
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowPasswordResetModal(false);
  };

  const switchToPasswordReset = () => {
    console.log('[ModalContext] Switching to password reset');
    setShowPasswordResetModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const closeAllModals = () => {
    console.log('[ModalContext] Closing all modals');
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