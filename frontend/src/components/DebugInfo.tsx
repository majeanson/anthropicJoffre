import { useState } from 'react';
import buildInfo from '../buildInfo.json';

export function DebugInfo() {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="mt-6 border-t-2 border-parchment-400 dark:border-gray-600 pt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg hover:from-indigo-100 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-2 border-indigo-200 dark:border-gray-600"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <span className="font-bold text-lg text-indigo-900 dark:text-indigo-200">Debug Fun</span>
        </div>
        <span className="text-xl text-indigo-600 dark:text-indigo-400">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 bg-parchment-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-indigo-200 dark:border-gray-600 space-y-4 animate-slideDown">
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
                {buildInfo.futureTodos.map((todo, index) => (
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
      )}
    </div>
  );
}
