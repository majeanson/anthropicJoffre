import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext'; // Sprint 3 Phase 1
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  console.log('🚨 Initializing Sentry with DSN:', import.meta.env.VITE_SENTRY_DSN?.substring(0, 30) + '...');
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in development
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
  console.log('✅ Sentry initialized successfully');
} else {
  console.warn('⚠️ Sentry DSN not found. Error tracking disabled.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <GameProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </GameProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
