/**
 * PlayingPhase Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when PlayingPhase encounters an error
 */

export function PlayingPhaseFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-red-500 p-8 max-w-md text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Game Error
        </h2>
        <p className="text-gray-300 mb-6">
          Something went wrong during gameplay. Your game state should be preserved.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            Reload Game
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            Return to Lobby
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          If this persists, please refresh the page or contact support
        </p>
      </div>
    </div>
  );
}
