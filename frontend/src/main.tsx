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
// TEMPORARY: Hardcode DSN to test Sentry - TODO: Remove after verifying Vercel env vars
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || 'https://98c89a1454b32d24fd78092cf6a297e8@o4510241708244992.ingest.us.sentry.io/4510241709293568';

console.log('🔍 Environment check:', {
  hasEnvVar: !!import.meta.env.VITE_SENTRY_DSN,
  envVarValue: import.meta.env.VITE_SENTRY_DSN ? import.meta.env.VITE_SENTRY_DSN.substring(0, 30) + '...' : 'NOT SET',
  usingDSN: SENTRY_DSN.substring(0, 30) + '...'
});

if (SENTRY_DSN) {
  const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production';
  console.log('🚨 Initializing Sentry with DSN:', SENTRY_DSN.substring(0, 30) + '...');
  console.log('🌍 Sentry environment:', sentryEnvironment);

  // Get backend URL for tunnel (use production URL or local dev)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://anthropicjoffre-production.up.railway.app';
  const tunnelUrl = `${BACKEND_URL}/api/sentry-tunnel`;
  console.log('🚇 Sentry tunnel:', tunnelUrl);

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: sentryEnvironment,
    // Use tunnel to bypass ad blockers
    tunnel: tunnelUrl,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Debug mode for troubleshooting
    debug: true,
    // Ensure errors are sent
    beforeSend(event) {
      console.log('📤 Sentry sending event:', event.event_id, event.message || event.exception);
      return event; // Always send the event
    },
    // Track transport errors
    beforeSendTransaction(transaction) {
      console.log('📤 Sentry sending transaction:', transaction.transaction);
      return transaction;
    },
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
