import { useState } from 'react';
import { Modal, Button } from './ui';

interface HowToPlayProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: TabId;
  onRegister?: () => void;
  onLogin?: () => void;
}

type TabId = 'rules' | 'features' | 'rewards' | 'register';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'rules', label: 'Game Rules', icon: '📖' },
  { id: 'features', label: 'Features', icon: '⚙️' },
  { id: 'rewards', label: 'XP & Coins', icon: '🪙' },
  { id: 'register', label: 'Why Register', icon: '🔐' },
];

// Helper for section cards - uses CSS variables for consistent theming
type SectionVariant = 'orange' | 'purple' | 'yellow' | 'teal' | 'green' | 'blue' | 'accent' | 'success' | 'warning' | 'info' | 'team1' | 'team2' | 'default';

const sectionBorderClasses: Record<SectionVariant, string> = {
  orange: 'border-team1',
  purple: 'border-team2',
  yellow: 'border-yellow-500',
  teal: 'border-teal-500',
  green: 'border-green-500',
  blue: 'border-blue-500',
  accent: 'border-skin-border-accent',
  success: 'border-skin-status-success',
  warning: 'border-skin-status-warning',
  info: 'border-skin-status-info',
  team1: 'border-skin-team1-primary',
  team2: 'border-skin-team2-primary',
  default: 'border-skin-border-default',
};

const SectionCard = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: SectionVariant;
}) => (
  <div className={`rounded-lg p-4 border-2 bg-skin-tertiary ${sectionBorderClasses[variant]}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-skin-primary">{children}</h3>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="px-2 py-1 rounded border font-mono text-sm bg-skin-tertiary border-skin-default text-skin-primary">
    {children}
  </kbd>
);

// Tab navigation component
const TabNavigation = ({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) => (
  <div className="flex flex-wrap gap-2 mb-6 p-1 rounded-lg bg-skin-primary">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
          ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'hover:bg-white/10 text-skin-secondary hover:text-white'
          }
        `}
      >
        <span>{tab.icon}</span>
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </div>
);

// ============================================================================
// TAB CONTENT: Game Rules
// ============================================================================
const RulesContent = () => (
  <div className="space-y-5">
    {/* Overview */}
    <SectionCard variant="accent">
      <SectionTitle>Overview</SectionTitle>
      <p className="text-base leading-relaxed">
        J⋀ffre is a 4-player, 2-team trick-taking card game. Teams compete to win tricks and
        accumulate points. The first team to reach 41 points wins the game!
      </p>
    </SectionCard>

    {/* Special Cards */}
    <SectionCard variant="success">
      <SectionTitle>Cards</SectionTitle>
      <ul className="space-y-2 text-base">
        <li>• 4 colors (Red, Brown, Green, Blue) with cards going from [0-7]</li>
        <li>• Two special cards that you WANT to get ... or AVOID!</li>
        <li>
          • <strong className="text-skin-suit-red">Red 0:</strong> +5 bonus points (6 total for that
          trick)
        </li>
        <li>
          • <strong className="text-skin-suit-brown">Brown 0:</strong> -3 penalty points (-2 total
          for that trick)
        </li>
        <li>• All other tricks worth 1 point</li>
      </ul>
    </SectionCard>

    {/* Betting Phase */}
    <SectionCard variant="warning">
      <SectionTitle>Betting Phase</SectionTitle>
      <ul className="space-y-2 text-base">
        <li>• The winning bet starts the round. First card played chooses the trump color!</li>
        <li>• Each round starts with betting (7-12 points)</li>
        <li>• Players take turns bidding after the dealer</li>
        <li>
          • <strong>Non-dealers must raise</strong> or skip (if no bets yet)
        </li>
        <li>
          • <strong>Dealer can equalize or raise</strong> - dealer wins ties!
        </li>
        <li>• Dealer cannot skip if no players bet beforehand</li>
        <li>• "Without Trump" doubles the bet stakes</li>
        <li>• Highest bidder becomes the offensive team</li>
      </ul>
    </SectionCard>

    {/* Playing Phase */}
    <SectionCard variant="info">
      <SectionTitle>Playing Phase</SectionTitle>
      <ul className="space-y-2 text-base">
        <li>• Highest bidder leads the first trick. First card played chooses the trump color!</li>
        <li>
          • <strong>You must follow suit</strong> if you have the led color
        </li>
        <li>• Trump (bet color) beats non-trump cards</li>
        <li>• Highest card in led suit wins if no trump played</li>
        <li>• Winner of each trick leads the next</li>
      </ul>
    </SectionCard>

    {/* Scoring */}
    <SectionCard variant="team2">
      <SectionTitle>Scoring</SectionTitle>
      <ul className="space-y-2 text-base">
        <li>• Offensive team wins if they meet their bet</li>
        <li>• They gain points equal to their bet</li>
        <li>• Defensive team gains points from tricks won</li>
        <li>• If offensive fails, they lose bet points</li>
      </ul>
    </SectionCard>

    {/* Teams */}
    <SectionCard variant="accent">
      <SectionTitle>Teams</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-3 border-2 border-skin-team1-primary bg-skin-team1-primary/15">
          <p className="font-bold text-skin-team1-primary">Team 1 (Orange)</p>
          <p className="text-sm mt-1 text-skin-secondary">Players 1 & 3</p>
        </div>
        <div className="rounded-lg p-3 border-2 border-skin-team2-primary bg-skin-team2-primary/15">
          <p className="font-bold text-skin-team2-primary">Team 2 (Purple)</p>
          <p className="text-sm mt-1 text-skin-secondary">Players 2 & 4</p>
        </div>
      </div>
    </SectionCard>
  </div>
);

// ============================================================================
// TAB CONTENT: Features
// ============================================================================
const FeaturesContent = () => (
  <div className="space-y-5">
    {/* Beginner Mode Features */}
    <SectionCard variant="success">
      <SectionTitle>Beginner Mode (Toggle in settings)</SectionTitle>
      <div className="space-y-4">
        {/* Move Suggestions */}
        <div>
          <p className="font-semibold mb-2 text-skin-success">Move Suggestions (Press to Show)</p>
          <ul className="space-y-1 ml-4 text-sm">
            <li>
              • A <strong>suggestion button</strong> appears next to your name during your turn
            </li>
            <li>
              • <strong>Press and hold</strong> to peek at the AI's recommended card
            </li>
            <li>• See reasoning for the suggestion and alternative options</li>
            <li>
              • Suggestions include defensive strategies (like using Brown 0 to poison opponent's
              trick)
            </li>
          </ul>
        </div>

        {/* Bot Thinking Insights */}
        <div>
          <p className="font-semibold mb-2 text-skin-success">Bot Thinking Insights</p>
          <ul className="space-y-1 ml-4 text-sm">
            <li>• Bot difficulty badges (Easy/Med/Hard) show next to bot player names</li>
            <li>
              • <strong>Press and hold the badge</strong> to see what the bot is thinking
            </li>
            <li>• Learn strategic concepts like trump bleed, defensive plays, and trick control</li>
          </ul>
        </div>

        {/* Clickable Player Names */}
        <div>
          <p className="font-semibold mb-2 text-skin-success">Clickable Player Names</p>
          <ul className="space-y-1 ml-4 text-sm">
            <li>• Click any human player's name to view their profile and stats</li>
            <li>• Works during betting phase, playing phase, and team selection</li>
          </ul>
        </div>
      </div>
    </SectionCard>

    {/* Card Queuing */}
    <SectionCard variant="info">
      <SectionTitle>Card Queuing</SectionTitle>
      <div className="space-y-2 text-base">
        <p>
          <strong>Pre-select your next card</strong> while waiting for your turn! Click any card in
          your hand when it's <em>not</em> your turn to queue it.
        </p>
        <ul className="space-y-1 ml-4 text-sm">
          <li>
            • <strong>Queued cards</strong> are marked with a gold "QUEUED" badge
          </li>
          <li>
            • The card will <strong>auto-play instantly</strong> when your turn arrives
          </li>
          <li>
            • Click the same card again to <strong>unqueue</strong> it
          </li>
        </ul>
      </div>
    </SectionCard>

    {/* Keyboard Navigation - Desktop only */}
    <div className="hidden md:block">
      <SectionCard variant="team2">
        <SectionTitle>Keyboard Shortcuts</SectionTitle>
        <div className="space-y-3 text-base">
          <div>
            <p className="font-semibold mb-1 text-skin-accent">Card Navigation:</p>
            <ul className="space-y-1 ml-4 text-sm">
              <li>
                • <Kbd>←</Kbd> <Kbd>→</Kbd> Navigate between cards
              </li>
              <li>
                • <Kbd>1</Kbd>-<Kbd>9</Kbd> Quick select by position
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1 text-skin-accent">Card Actions:</p>
            <ul className="space-y-1 ml-4 text-sm">
              <li>
                • <Kbd>Enter</Kbd> / <Kbd>Space</Kbd> Play selected card (or queue if not your turn)
              </li>
              <li>
                • <Kbd>Esc</Kbd> Clear selection
              </li>
            </ul>
          </div>
        </div>
      </SectionCard>
    </div>

    {/* Side Bets Feature */}
    <SectionCard variant="team1">
      <SectionTitle>🎲 Side Bets</SectionTitle>
      <ul className="space-y-1 ml-4 text-sm">
        <li>• Create bets during gameplay using coins</li>
        <li>
          • <strong>Preset bets</strong> (auto-resolve): Red 0 winner, Brown 0 victim, Bet made,
          etc.
        </li>
        <li>
          • <strong>Custom bets</strong> (manual): Create any bet, both parties agree on winner
        </li>
        <li>
          • Win streaks give <strong>multipliers</strong>: 3+ wins = 1.25x, 5+ = 1.5x, 7+ = 2x!
        </li>
        <li>• Click the 🎲 button in the game header to open the side bets panel</li>
      </ul>
    </SectionCard>
  </div>
);

// ============================================================================
// TAB CONTENT: XP & Coins (Rewards)
// ============================================================================
const RewardsContent = () => (
  <div className="space-y-5">
    {/* XP Sources */}
    <SectionCard variant="team2">
      <SectionTitle>⭐ Experience Points (XP)</SectionTitle>
      <ul className="space-y-1 ml-4 text-sm">
        <li>
          • <strong>Win tricks</strong> - XP for each trick won
        </li>
        <li>
          • <strong>Win rounds</strong> - Bonus XP for successful bets
        </li>
        <li>
          • <strong>Win games</strong> - Major XP boost for victory
        </li>
        <li>
          • <strong>Complete daily quests</strong> - Bonus XP rewards
        </li>
        <li>
          • <strong>Claim weekly calendar</strong> - Daily login XP
        </li>
        <li>
          • <strong>Special plays</strong> - XP for red zeros, trump plays, etc.
        </li>
      </ul>
      <p className="text-sm mt-3 text-skin-secondary">
        Level up to unlock new card backs, avatars, and skins!
      </p>
    </SectionCard>

    {/* Coin Sources */}
    <SectionCard variant="yellow">
      <SectionTitle>🪙 Coins (Cosmetic Currency)</SectionTitle>
      <ul className="space-y-1 ml-4 text-sm">
        <li>
          • <strong>Complete games (ranked)</strong> - 5 coins for finishing, +10 bonus for winning
        </li>
        <li>
          • <strong>Daily quests</strong> - Complete objectives for coin rewards
        </li>
        <li>
          • <strong>Weekly calendar</strong> - Claim daily rewards (up to 100 coins on special
          days!)
        </li>
        <li>
          • <strong>Unlock achievements</strong> - Bronze (100), Silver (250), Gold (500), Platinum
          (1000)
        </li>
        <li>
          • <strong>Win side bets</strong> - Double your bet on correct predictions!
        </li>
      </ul>
    </SectionCard>

    {/* Daily Quests */}
    <SectionCard variant="team1">
      <SectionTitle>📅 Daily Quests & Calendar</SectionTitle>
      <ul className="space-y-1 ml-4 text-sm">
        <li>
          • <strong>3 daily quests</strong> reset each day - Win X games, collect red zeros, etc.
        </li>
        <li>
          • <strong>Weekly calendar</strong> - Claim rewards each day you log in
        </li>
        <li>
          • <strong>Streak bonuses</strong> - Maintain login streaks for better rewards
        </li>
        <li>• Click the 📅 calendar icon to view your quests and progress</li>
      </ul>
      <p className="text-sm italic mt-3 p-2 rounded bg-team1-10 text-skin-secondary">
        Tip: Complete all 3 daily quests for bonus XP!
      </p>
    </SectionCard>

    {/* Achievements */}
    <SectionCard variant="teal">
      <SectionTitle>🏆 Achievements</SectionTitle>
      <ul className="space-y-1 ml-4 text-sm">
        <li>
          • <strong>50+ achievements</strong> to unlock across multiple categories
        </li>
        <li>
          • <strong>Tiers</strong>: Bronze → Silver → Gold → Platinum
        </li>
        <li>
          • <strong>Secret achievements</strong> - Discover hidden challenges!
        </li>
        <li>• Each unlock rewards coins and achievement points</li>
      </ul>
    </SectionCard>
  </div>
);

// ============================================================================
// TAB CONTENT: Why Register
// ============================================================================
const RegisterContent = ({
  onRegister,
  onLogin,
}: {
  onRegister?: () => void;
  onLogin?: () => void;
}) => (
  <div className="space-y-5">
    {/* Action buttons at top if callbacks provided */}
    {(onRegister || onLogin) && (
      <div className="flex flex-col sm:flex-row gap-3">
        {onRegister && (
          <Button
            onClick={onRegister}
            variant="success"
            size="lg"
            fullWidth
            leftIcon={<span>🚀</span>}
          >
            Create Free Account
          </Button>
        )}
        {onLogin && (
          <Button
            onClick={onLogin}
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<span>🔑</span>}
          >
            I Already Have an Account
          </Button>
        )}
      </div>
    )}

    <SectionCard variant="green">
      <p className="text-base mb-4 text-skin-secondary">
        You can play as a guest, but registering unlocks the full experience:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Progression */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-purple-500">⭐ XP & Leveling</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• Track XP across all games</li>
            <li>• Level up (1-100+)</li>
            <li>• Unlock titles & borders</li>
          </ul>
        </div>

        {/* Currency */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-yellow-500">🪙 Coins & Cosmetics</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• Earn & save coins</li>
            <li>• Unlock card backs & skins</li>
            <li>• Place side bets</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-blue-500">📊 Stats & ELO Rating</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• Track wins, losses, streaks</li>
            <li>• ELO rating system</li>
            <li>• Appear on leaderboards</li>
          </ul>
        </div>

        {/* Social */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-pink-500">👥 Friends & Social</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• Add friends</li>
            <li>• Direct messages</li>
            <li>• Invite to games</li>
          </ul>
        </div>

        {/* Daily Rewards */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-orange-500">📅 Daily Rewards</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• Daily quests</li>
            <li>• Weekly calendar rewards</li>
            <li>• Login streak bonuses</li>
          </ul>
        </div>

        {/* Achievements */}
        <div className="p-3 rounded-lg bg-skin-primary">
          <p className="font-semibold mb-1 text-teal-500">🏆 Achievements</p>
          <ul className="text-sm space-y-1 text-skin-secondary">
            <li>• 50+ achievements</li>
            <li>• Bronze → Platinum tiers</li>
            <li>• Secret achievements</li>
          </ul>
        </div>
      </div>

      {/* Only show text hint if no action buttons */}
      {!onRegister && !onLogin && (
        <p className="text-sm italic mt-4 p-2 rounded text-center bg-green-500/15 text-skin-secondary">
          Registration is free! Click "Register" in the top-right corner to get started.
        </p>
      )}
    </SectionCard>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function HowToPlay({
  isModal = false,
  isOpen = true,
  onClose,
  initialTab = 'rules',
  onRegister,
  onLogin,
}: HowToPlayProps) {
  // Early return BEFORE hooks (for modal closed state)
  if (isModal && !isOpen) return null;

  // Now safe to use hooks
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rules':
        return <RulesContent />;
      case 'features':
        return <FeaturesContent />;
      case 'rewards':
        return <RewardsContent />;
      case 'register':
        return <RegisterContent onRegister={onRegister} onLogin={onLogin} />;
      default:
        return <RulesContent />;
    }
  };

  const content = (
    <div className="text-skin-primary">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </div>
  );

  // If it's a modal, wrap in Modal component
  if (isModal) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title="How to Play"
        icon="📖"
        theme="arcane"
        size="lg"
        testId="how-to-play-modal"
      >
        {content}

        <Button onClick={onClose} variant="primary" size="lg" fullWidth autoFocus className="mt-6">
          Got it!
        </Button>
      </Modal>
    );
  }

  // Otherwise, render as inline content
  return content;
}
