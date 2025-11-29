import { Modal, Button, UICard } from './ui';

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
      <UICard variant="bordered" size="md" className="border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/40">
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
      </UICard>

      {/* Playing Phase */}
      <UICard variant="bordered" size="md" className="border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/40">
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
      </UICard>

      {/* Card Queuing */}
      <UICard variant="bordered" size="md" className="border-cyan-300 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/40">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Card Queuing
        </h3>
        <div className="space-y-2 text-lg">
          <p>
            <strong>Pre-select your next card</strong> while waiting for your turn!
            Click any card in your hand when it's <em>not</em> your turn to queue it.
          </p>
          <ul className="space-y-2 ml-4">
            <li>• <strong>Queued cards</strong> are marked with a gold "QUEUED" badge</li>
            <li>• The card will <strong>auto-play instantly</strong> when your turn arrives</li>
            <li>• Click the same card again to <strong>unqueue</strong> it</li>
            <li>• Only one card can be queued at a time</li>
            <li>• Great for fast-paced gameplay and quick decision-making!</li>
          </ul>
          <p className="text-sm text-cyan-700 dark:text-cyan-300 italic mt-3 bg-cyan-100 dark:bg-cyan-800/50 p-2 rounded">
            Pro tip: Queue your card early to think ahead while others play!
          </p>
        </div>
      </UICard>

      {/* Beginner Mode Features */}
      <UICard variant="bordered" size="md" className="border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/40">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Beginner Mode Features
        </h3>
        <div className="space-y-4">
          {/* Move Suggestions */}
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 text-lg">
              Move Suggestions (Press to Show)
            </p>
            <ul className="space-y-2 ml-4 text-base">
              <li>• A <strong>suggestion button</strong> appears next to your name during your turn</li>
              <li>• <strong>Press and hold</strong> to peek at the AI's recommended card</li>
              <li>• See reasoning for the suggestion and alternative options</li>
              <li>• Release to hide - you control when to see hints</li>
              <li>• Suggestions include defensive strategies (like using Brown 0 to poison opponent's trick)</li>
            </ul>
          </div>

          {/* Bot Thinking Insights */}
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 text-lg">
              Bot Thinking Insights
            </p>
            <ul className="space-y-2 ml-4 text-base">
              <li>• Bot difficulty badges (Easy/Med/Hard) show next to bot player names</li>
              <li>• <strong>Press and hold the badge</strong> to see what the bot is thinking</li>
              <li>• Learn strategic concepts like trump bleed, defensive plays, and trick control</li>
              <li>• Release to hide - great for learning without spoiling your own decisions</li>
            </ul>
          </div>

          {/* Clickable Player Names */}
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 text-lg">
              Clickable Player Names
            </p>
            <ul className="space-y-2 ml-4 text-base">
              <li>• Click any human player's name to view their profile and stats</li>
              <li>• Works during betting phase, playing phase, and team selection</li>
              <li>• See win rates, game history, and recent performance</li>
              <li>• Bot names are not clickable (they don't have profiles)</li>
            </ul>
          </div>

          <p className="text-sm text-emerald-700 dark:text-emerald-300 italic mt-3 bg-emerald-100 dark:bg-emerald-800/50 p-2 rounded">
            Learning Tip: Use bot thinking insights to understand advanced strategies, then apply them yourself!
          </p>
        </div>
      </UICard>

      {/* Keyboard Navigation - Desktop only */}
      <UICard variant="bordered" size="md" className="hidden md:block border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-3 text-lg">
          <div>
            <p className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">Card Navigation:</p>
            <ul className="space-y-1 ml-4">
              <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">←</kbd> <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">→</kbd> Navigate between cards</li>
              <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">Tab</kbd> / <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">Shift+Tab</kbd> Cycle through cards</li>
              <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">1</kbd>-<kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">9</kbd> Quick select by position</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">Card Actions:</p>
            <ul className="space-y-1 ml-4">
              <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">Enter</kbd> / <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">Space</kbd> Play selected card (or queue if not your turn)</li>
              <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">Esc</kbd> Clear selection</li>
            </ul>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 italic mt-2">
            Tip: You can queue a card before your turn for instant auto-play!
          </p>
        </div>
      </UICard>

      {/* Special Cards */}
      <UICard variant="bordered" size="md" className="border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/40">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Special Cards
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• <strong className="text-red-600">Red 0:</strong> +5 bonus points (6 total for that trick)</li>
          <li>• <strong className="text-amber-800">Brown 0:</strong> -3 penalty points (-2 total for that trick)</li>
          <li>• All other tricks worth 1 point</li>
        </ul>
      </UICard>

      {/* Scoring */}
      <UICard variant="bordered" size="md" className="border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40">
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Scoring
        </h3>
        <ul className="space-y-2 text-lg">
          <li>• Offensive team wins if they meet their bet</li>
          <li>• They gain points equal to their bet</li>
          <li>• Defensive team gains points from tricks won</li>
          <li>• If offensive fails, they lose bet points</li>
        </ul>
      </UICard>

      {/* Teams */}
      <section>
        <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          Teams
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <UICard variant="bordered" size="md" className="border-orange-400 dark:border-orange-600 bg-orange-100 dark:bg-orange-900/40">
            <p className="text-lg font-bold text-orange-800 dark:text-orange-200">Team 1 (Orange)</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Players 1 & 3</p>
          </UICard>
          <UICard variant="bordered" size="md" className="border-purple-400 dark:border-purple-600 bg-purple-100 dark:bg-purple-900/40">
            <p className="text-lg font-bold text-purple-800 dark:text-purple-200">Team 2 (Purple)</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Players 2 & 4</p>
          </UICard>
        </div>
      </section>
    </div>
  );

  // If it's a modal, wrap in Modal component
  if (isModal) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title="Game Rules"
        icon="📖"
        theme="parchment"
        size="lg"
        testId="how-to-play-modal"
      >
        {content}

        <Button
          onClick={onClose}
          variant="primary"
          size="lg"
          fullWidth
          autoFocus
          className="mt-8"
        >
          Got it!
        </Button>
      </Modal>
    );
  }

  // Otherwise, render as inline content
  return content;
}
