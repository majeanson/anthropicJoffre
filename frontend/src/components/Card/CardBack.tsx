/**
 * CardBack Component
 * Displays the back of a card (for opponent hands and deck)
 * Features alchemical circle pattern with team-specific color variations
 */

import { sizeStyles } from './cardStyles';

interface CardBackProps {
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** Optional team color tint */
  teamColor?: 1 | 2;
}

export function CardBack({ size = 'medium', teamColor }: CardBackProps) {
  const sizeConfig = sizeStyles[size];

  // Determine team-specific classes
  const teamBorderClass =
    teamColor === 1
      ? 'border-skin-team1-primary'
      : teamColor === 2
        ? 'border-skin-team2-primary'
        : 'border-skin-accent';
  const teamBackClass =
    teamColor === 1 ? 'card-back-team1' : teamColor === 2 ? 'card-back-team2' : 'card-back-bg';
  const teamSymbolClass =
    teamColor === 1
      ? 'card-center-symbol-team1'
      : teamColor === 2
        ? 'card-center-symbol-team2'
        : 'card-center-symbol';

  return (
    <div
      className={`
        ${sizeConfig.container}
        rounded-[var(--radius-lg)]
        flex items-center justify-center
        relative overflow-hidden
        border-solid
        ${teamBorderClass}
        ${teamBackClass}
      `}
    >
      {/* Alchemical circle pattern */}
      <div className={`absolute inset-3 rounded-full border ${teamBorderClass} opacity-20`} />

      {/* Sacred geometry corners */}
      <div
        className={`absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 ${teamBorderClass} opacity-50`}
      />

      {/* Center symbol */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${teamSymbolClass}`}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4L21 20H3L12 4Z"
            className="stroke-skin-inverse"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
