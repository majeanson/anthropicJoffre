import { Modal, Button } from './ui';

interface HowToPlayProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

// Helper for section cards - uses CSS variables for consistent theming
const SectionCard = ({
  children,
  borderColor,
}: {
  children: React.ReactNode;
  borderColor: string;
}) => (
  <div
    className="rounded-lg p-4 border-2"
    style={{
      borderColor,
      backgroundColor: 'var(--color-bg-tertiary)',
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3
    className="text-2xl font-bold mb-3 flex items-center gap-2"
    style={{ color: 'var(--color-text-primary)' }}
  >
    {children}
  </h3>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="px-2 py-1 rounded border font-mono text-sm"
    style={{
      backgroundColor: 'var(--color-bg-tertiary)',
      borderColor: 'var(--color-border-default)',
      color: 'var(--color-text-primary)',
    }}
  >
    {children}
  </kbd>
);

export function HowToPlay({ isModal = false, isOpen = true, onClose }: HowToPlayProps) {
  // If it's a modal and not open, don't render
  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-6" style={{ color: 'var(--color-text-primary)' }}>
      {/* Overview */}
      <section>
        <SectionTitle>Overview</SectionTitle>
        <p className="text-lg leading-relaxed">
          J⋀ffre is a 4-player, 2-team trick-taking card game. Teams compete to win tricks and accumulate points.
          The first team to reach 41 points wins the game!
        </p>
      </section>

      {/* Special Cards */}
      <SectionCard borderColor="var(--color-success)">
        <SectionTitle>Cards</SectionTitle>
        <ul className="space-y-2 text-lg">
          <li>• 4 colors (Red, Brown, Green, Blue) with cards going from [0-7]</li>
          <li>• Two special cards that you WANT to get ... or AVOID!</li>
          <li>
            • <strong style={{ color: 'var(--color-suit-red)' }}>Red 0:</strong> +5 bonus points (6 total for that trick)
          </li>
          <li>
            • <strong style={{ color: 'var(--color-suit-brown)' }}>Brown 0:</strong> -3 penalty points (-2 total for that trick)
          </li>
          <li>• All other tricks worth 1 point</li>
        </ul>
      </SectionCard>

      {/* Betting Phase */}
      <SectionCard borderColor="var(--color-warning)">
        <SectionTitle>Betting Phase</SectionTitle>
        <ul className="space-y-2 text-lg">
          <li>• The winning bet starts the round. First card played chooses the trump color!</li>
          <li>• Each round starts with betting (7-12 points)</li>
          <li>• Players take turns bidding after the dealer</li>
          <li>• <strong>Non-dealers must raise</strong> or skip (if no bets yet)</li>
          <li>• <strong>Dealer can equalize or raise</strong> - dealer wins ties!</li>
          <li>• Dealer cannot skip if no players bet beforehand</li>
          <li>• "Without Trump" doubles the bet stakes</li>
          <li>• Highest bidder becomes the offensive team</li>
        </ul>
      </SectionCard>

      {/* Playing Phase */}
      <SectionCard borderColor="var(--color-info)">
        <SectionTitle>Playing Phase</SectionTitle>
        <ul className="space-y-2 text-lg">
          <li>• Highest bidder leads the first trick. First card played chooses the trump color!</li>
          <li>• <strong>You must follow suit</strong> if you have the led color</li>
          <li>• Trump (bet color) beats non-trump cards</li>
          <li>• Highest card in led suit wins if no trump played</li>
          <li>• Winner of each trick leads the next</li>
        </ul>
      </SectionCard>

      {/* Scoring */}
      <SectionCard borderColor="var(--color-team2-primary)">
        <SectionTitle>Scoring</SectionTitle>
        <ul className="space-y-2 text-lg">
          <li>• Offensive team wins if they meet their bet</li>
          <li>• They gain points equal to their bet</li>
          <li>• Defensive team gains points from tricks won</li>
          <li>• If offensive fails, they lose bet points</li>
        </ul>
      </SectionCard>

      {/* Beginner Mode Features */}
      <SectionCard borderColor="var(--color-success)">
        <SectionTitle>Beginner Mode Features (Toggle in settings)</SectionTitle>
        <div className="space-y-4">
          {/* Move Suggestions */}
          <div>
            <p className="font-semibold mb-2 text-lg" style={{ color: 'var(--color-success)' }}>
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
            <p className="font-semibold mb-2 text-lg" style={{ color: 'var(--color-success)' }}>
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
            <p className="font-semibold mb-2 text-lg" style={{ color: 'var(--color-success)' }}>
              Clickable Player Names
            </p>
            <ul className="space-y-2 ml-4 text-base">
              <li>• Click any human player's name to view their profile and stats</li>
              <li>• Works during betting phase, playing phase, and team selection</li>
              <li>• See win rates, game history, and recent performance</li>
              <li>• Bot names are not clickable (they don't have profiles)</li>
            </ul>
          </div>

          <p
            className="text-sm italic mt-3 p-2 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, var(--color-bg-tertiary))',
              color: 'var(--color-text-secondary)',
            }}
          >
            Learning Tip: Use bot thinking insights to understand advanced strategies, then apply them yourself!
          </p>
        </div>
      </SectionCard>

      {/* Card Queuing */}
      <SectionCard borderColor="var(--color-info)">
        <SectionTitle>Card Queuing</SectionTitle>
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
          <p
            className="text-sm italic mt-3 p-2 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, var(--color-bg-tertiary))',
              color: 'var(--color-text-secondary)',
            }}
          >
            Pro tip: Queue your card early to think ahead while others play!
          </p>
        </div>
      </SectionCard>

      {/* Keyboard Navigation - Desktop only */}
      <div className="hidden md:block">
        <SectionCard borderColor="var(--color-team2-primary)">
          <SectionTitle>Keyboard Shortcuts</SectionTitle>
          <div className="space-y-3 text-lg">
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-accent)' }}>
                Card Navigation:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <Kbd>←</Kbd> <Kbd>→</Kbd> Navigate between cards</li>
                <li>• <Kbd>Tab</Kbd> / <Kbd>Shift+Tab</Kbd> Cycle through cards</li>
                <li>• <Kbd>1</Kbd>-<Kbd>9</Kbd> Quick select by position</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-accent)' }}>
                Card Actions:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <Kbd>Enter</Kbd> / <Kbd>Space</Kbd> Play selected card (or queue if not your turn)</li>
                <li>• <Kbd>Esc</Kbd> Clear selection</li>
              </ul>
            </div>
            <p className="text-sm italic mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Tip: You can queue a card before your turn for instant auto-play!
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Teams */}
      <section>
        <SectionTitle>Teams</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4 border-2"
            style={{
              borderColor: 'var(--color-team1-primary)',
              backgroundColor: 'color-mix(in srgb, var(--color-team1-primary) 15%, var(--color-bg-tertiary))',
            }}
          >
            <p className="text-lg font-bold" style={{ color: 'var(--color-team1-primary)' }}>
              Team 1 (Orange)
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Players 1 & 3
            </p>
          </div>
          <div
            className="rounded-lg p-4 border-2"
            style={{
              borderColor: 'var(--color-team2-primary)',
              backgroundColor: 'color-mix(in srgb, var(--color-team2-primary) 15%, var(--color-bg-tertiary))',
            }}
          >
            <p className="text-lg font-bold" style={{ color: 'var(--color-team2-primary)' }}>
              Team 2 (Purple)
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Players 2 & 4
            </p>
          </div>
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
        theme="arcane"
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
