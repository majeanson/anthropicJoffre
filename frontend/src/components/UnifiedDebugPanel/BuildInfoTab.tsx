import { useState } from 'react';
import buildInfoJson from '../../buildInfo.json';
import { BuildInfo, CleanupResult } from '../../types/buildInfo';
import { CONFIG } from '../../config/constants';
import { Button } from '../ui';

const buildInfo = buildInfoJson as BuildInfo;

const SHOW_CLEANUP_BUTTON = true;

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function getCommitTitle(message: string) {
  return message.split('\n')[0];
}

export function BuildInfoTab() {
  const [showLatestFeatures, setShowLatestFeatures] = useState(false);
  const [showFutureFeatures, setShowFutureFeatures] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);

  const runCleanup = async () => {
    if (
      !confirm(
        '⚠️ This will DELETE all obsolete 6-character game IDs from the database.\n\nAre you sure you want to continue?'
      )
    ) {
      return;
    }

    setCleanupLoading(true);
    setCleanupError(null);
    setCleanupResult(null);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/cleanup-obsolete-games`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCleanupResult(data);
    } catch (error) {
      setCleanupError(error instanceof Error ? error.message : 'Failed to run cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Version */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏷️</span>
          <h3 className="font-bold text-purple-300 text-lg">Version</h3>
        </div>
        <p className="text-white font-mono text-2xl font-bold">v{buildInfo.version}</p>
        <p className="text-gray-400 text-sm mt-1">{buildInfo.buildStatus}</p>
      </div>

      {/* Build Date */}
      <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📅</span>
          <h3 className="font-bold text-blue-300 text-lg">Build Date</h3>
        </div>
        <p className="text-white">{formatDate(buildInfo.buildDate)}</p>
      </div>

      {/* Git Info */}
      {buildInfo.git && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💾</span>
            <h3 className="font-bold text-green-300 text-lg">Latest Commit</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-green-400 font-bold bg-green-950 px-2 py-1 rounded">
              {buildInfo.git.commitHash}
            </span>
            <span className="text-xs text-gray-400">on {buildInfo.git.branch}</span>
          </div>
          <p className="text-white text-sm">{getCommitTitle(buildInfo.git.commitMessage)}</p>
        </div>
      )}

      {/* Test Status */}
      {buildInfo.testsStatus && (
        <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✅</span>
            <h3 className="font-bold text-amber-300 text-lg">Test Status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-gray-400 text-xs">Backend</div>
              <div className="text-white font-bold">{buildInfo.testsStatus.backend}</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-gray-400 text-xs">E2E</div>
              <div className="text-white font-bold">{buildInfo.testsStatus.e2e}</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-gray-400 text-xs">Overall</div>
              <div className="text-white font-bold">{buildInfo.testsStatus.overall}</div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Features */}
      {buildInfo.latestDoneFeatures && buildInfo.latestDoneFeatures.length > 0 && (
        <div className="bg-gradient-to-r from-pink-900/50 to-rose-900/50 border border-pink-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <h3 className="font-bold text-pink-300 text-lg">Latest Features</h3>
            </div>
            <Button
              onClick={() => setShowLatestFeatures(!showLatestFeatures)}
              variant="primary"
              size="sm"
            >
              {showLatestFeatures ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showLatestFeatures && (
            <div className="space-y-3 animate-slide-in">
              {buildInfo.latestDoneFeatures.map((featureGroup, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 border border-pink-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-pink-300">{featureGroup.title}</span>
                    <span className="text-xs text-gray-400">{featureGroup.date}</span>
                  </div>
                  <ul className="space-y-1 ml-4">
                    {featureGroup.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 flex-shrink-0">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Future Features */}
      {buildInfo.futureTodos && buildInfo.futureTodos.length > 0 && (
        <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 border border-violet-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <h3 className="font-bold text-violet-300 text-lg">Future Features</h3>
            </div>
            <Button
              onClick={() => setShowFutureFeatures(!showFutureFeatures)}
              variant="primary"
              size="sm"
            >
              {showFutureFeatures ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showFutureFeatures && (
            <ul className="space-y-2 animate-slide-in">
              {buildInfo.futureTodos.map((todo, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-300 bg-gray-800/50 px-3 py-2 rounded border border-violet-500/20"
                >
                  <span className="text-violet-400 flex-shrink-0">▸</span>
                  <span>{todo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Database Cleanup */}
      {SHOW_CLEANUP_BUTTON && (
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🗑️</span>
            <h3 className="font-bold text-red-300 text-lg">Database Cleanup</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Remove obsolete 6-character game IDs from production database
          </p>
          <Button
            onClick={runCleanup}
            disabled={cleanupLoading}
            variant="danger"
            size="md"
            className="w-full"
          >
            {cleanupLoading ? '⏳ Cleaning...' : '🗑️ Run Cleanup'}
          </Button>

          {cleanupError && (
            <div className="mt-2 bg-red-900/30 px-3 py-2 rounded border border-red-500">
              <p className="text-sm text-red-300">❌ {cleanupError}</p>
            </div>
          )}

          {cleanupResult && (
            <div className="mt-2 bg-green-900/30 px-3 py-3 rounded border border-green-500">
              <p className="text-sm font-bold text-green-300 mb-2">✅ {cleanupResult.message}</p>
              <div className="text-xs text-gray-300 space-y-1">
                <p>• In-memory games deleted: {cleanupResult.deletedCount?.inMemory || 0}</p>
                <p>• Active games (DB) deleted: {cleanupResult.deletedCount?.activeGames || 0}</p>
                <p>• Finished games (DB) deleted: {cleanupResult.deletedCount?.finishedGames || 0}</p>
                <p>• Sessions deleted: {cleanupResult.deletedCount?.sessions || 0}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
