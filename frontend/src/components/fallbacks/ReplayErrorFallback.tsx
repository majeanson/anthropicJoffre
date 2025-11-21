/**
 * GameReplay Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when GameReplay encounters an error
 */

interface ReplayErrorFallbackProps {
  onClose?: () => void;
}

export function ReplayErrorFallback({ onClose }: ReplayErrorFallbackProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onKeyDown={(e) => e.stopPropagation()}>
      <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-red-500 p-8 max-w-md text-center">
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Replay Error
        </h2>
        <p className="text-gray-300 mb-6">
          Failed to load or play the game replay. The replay data may be corrupted or unavailable.
        </p>
        <div className="space-y-3">
          <button
            onClick={onClose || (() => window.location.reload())}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            Close Replay
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
