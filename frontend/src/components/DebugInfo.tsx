import buildInfo from '../buildInfo.json';

interface DebugInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugInfo({ isOpen, onClose }: DebugInfoProps) {
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getCommitTitle = (message: string) => {
    return message.split('\n')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-indigo-600 dark:border-indigo-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎮</span>
            <h2 className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 font-serif">Debug Fun</h2>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Version */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🏷️</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Version</h3>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                v{buildInfo.version}
              </p>
            </div>
          </div>

          {/* Build Date */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📅</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Build Date</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                {formatDate(buildInfo.buildDate)}
              </p>
            </div>
          </div>

          {/* Latest Commit */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💾</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Latest Commit</h3>
              <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    {buildInfo.git.commitHash}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    on {buildInfo.git.branch}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                  {getCommitTitle(buildInfo.git.commitMessage)}
                </p>
              </div>
            </div>
          </div>

          {/* Future Todos */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚀</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Future Features</h3>
              <ul className="space-y-2">
                {buildInfo.futureTodos.map((todo: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400 flex-shrink-0">▸</span>
                    <span>{todo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fun Stats */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
            <p className="text-center text-sm text-purple-900 dark:text-purple-200 font-semibold">
              🎉 Made with ❤️ and lots of ☕
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 bg-indigo-600 dark:bg-indigo-700 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors border-2 border-indigo-700 dark:border-indigo-600 text-lg"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
