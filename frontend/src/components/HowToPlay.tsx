interface HowToPlayProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function HowToPlay({ isModal = false, isOpen = true, onClose }: HowToPlayProps) {
  // If it's a modal and not open, don't render
  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-6 text-umber-800 dark:text-gray-200">
      {/* Overview */}
      <section>
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Overview
        </h3>
        <p className="text-lg leading-relaxed">
          J⋀ffre is a 4-player, 2-team trick-taking card game. Teams compete to win tricks and accumulate points.
          The first team to reach 41 points wins the game!
        </p>
      </section>

      {/* Betting Phase */}
      <section className="bg-yellow-50 dark:bg-yellow-900/40 rounded-lg p-4 border-2 border-yellow-300 dark:border-yellow-600">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Betting Phase
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• Each round starts with betting (7-12 points)</li>
          <li>• Players take turns bidding after the dealer</li>
          <li>• <strong>Non-dealers must raise</strong> or skip (if no bets yet)</li>
          <li>• <strong>Dealer can equalize or raise</strong> - dealer wins ties!</li>
          <li>• "Without Trump" doubles the bet stakes</li>
          <li>• Highest bidder becomes the offensive team</li>
        </ul>
      </section>

      {/* Playing Phase */}
      <section className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-600">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Playing Phase
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• Highest bidder leads the first trick</li>
          <li>• <strong>You must follow suit</strong> if you have the led color</li>
          <li>• Trump (bet color) beats non-trump cards</li>
          <li>• Highest card in led suit wins if no trump played</li>
          <li>• Winner of each trick leads the next</li>
        </ul>
      </section>

      {/* Special Cards */}
      <section className="bg-green-50 dark:bg-green-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Special Cards
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• <strong className="text-red-600">Red 0:</strong> +5 bonus points (6 total for that trick)</li>
          <li>• <strong className="text-amber-800">Brown 0:</strong> -3 penalty points (-2 total for that trick)</li>
          <li>• All other tricks worth 1 point</li>
        </ul>
      </section>

      {/* Scoring */}
      <section className="bg-purple-50 dark:bg-purple-900/40 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-600">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Scoring
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• Offensive team wins if they meet their bet</li>
          <li>• They gain points equal to their bet</li>
          <li>• Defensive team gains points from tricks won</li>
          <li>• If offensive fails, they lose bet points</li>
        </ul>
      </section>

      {/* Teams */}
      <section>
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Teams
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-100 dark:bg-orange-900/40 rounded-lg p-4 border-2 border-orange-400 dark:border-orange-600">
            <p className="text-lg font-bold text-orange-800 dark:text-orange-200">Team 1 (Orange)</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Players 1 & 3</p>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-4 border-2 border-purple-400 dark:border-purple-600">
            <p className="text-lg font-bold text-purple-800 dark:text-purple-200">Team 2 (Purple)</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Players 2 & 4</p>
          </div>
        </div>
      </section>
    </div>
  );

  // If it's a modal, wrap in modal container
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-parchment-50 dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-umber-600 dark:border-gray-600" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold text-umber-900 dark:text-gray-100 font-serif">Game Rules</h2>
            <button
              onClick={onClose}
              className="text-umber-600 dark:text-gray-400 hover:text-umber-800 dark:hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          {content}

          <button
            onClick={onClose}
            autoFocus
            className="w-full mt-8 bg-umber-600 text-parchment-50 py-4 rounded-lg font-bold hover:bg-umber-700 transition-colors border-2 border-umber-700 text-lg focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, render as inline content
  return content;
}
