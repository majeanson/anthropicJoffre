import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext'; // Sprint 3 Phase 1
import { SkinProvider } from './contexts/SkinContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import logger from './utils/logger';
import { initWebVitals } from './utils/webVitals';

// Initialize Sentry for error tracking
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production';
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://anthropicjoffre-production.up.railway.app';
  const tunnelUrl = `${BACKEND_URL}/api/sentry-tunnel`;

  logger.info('Initializing Sentry', { environment: sentryEnvironment, tunnel: tunnelUrl });

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: sentryEnvironment,
    // Use tunnel to bypass ad blockers
    tunnel: tunnelUrl,
    // Release version for tracking deployments
    release: 'trick-card-game@2.0.0',
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
    debug: import.meta.env.DEV,
  });
} else {
  logger.warn('Sentry DSN not found. Error tracking disabled.');
}

// Initialize Web Vitals tracking (LCP, FID, CLS, TTFB, INP)
initWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SkinProvider>
        <AuthProvider>
          <SocketProvider>
            <GameProvider>
              <SettingsProvider>
                <App />
              </SettingsProvider>
            </GameProvider>
          </SocketProvider>
        </AuthProvider>
      </SkinProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
