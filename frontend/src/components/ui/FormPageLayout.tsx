/**
 * FormPageLayout Component
 *
 * Reusable layout wrapper for form pages with consistent styling:
 * - Gradient background (amber to red)
 * - Animated floating card emojis
 * - Card container with decorative corners
 *
 * Used by: GameCreationForm, JoinGameForm, GameWithBotCreationForm
 */

import { ReactNode } from 'react';

export interface FormPageLayoutProps {
  /** Form content */
  children: ReactNode;
  /** Page title */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Custom animated emojis (default: card emojis) */
  animatedEmojis?: [string, string, string, string];
  /** Additional className for the outer container */
  className?: string;
  /** Test ID for the container */
  testId?: string;
}

const defaultEmojis: [string, string, string, string] = ['🃏', '🎴', '🂡', '🂱'];

export function FormPageLayout({
  children,
  title,
  subtitle,
  animatedEmojis = defaultEmojis,
  className = '',
  testId,
}: FormPageLayoutProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 ${className}`}
      data-testid={testId}
    >
      {/* Animated background emojis */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce-3s" aria-hidden="true">
          {animatedEmojis[0]}
        </div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce-4s" aria-hidden="true">
          {animatedEmojis[1]}
        </div>
        <div
          className="absolute bottom-20 left-20 text-6xl animate-bounce-3s-half"
          aria-hidden="true"
        >
          {animatedEmojis[2]}
        </div>
        <div
          className="absolute bottom-10 right-10 text-6xl animate-bounce-4s-half"
          aria-hidden="true"
        >
          {animatedEmojis[3]}
        </div>
      </div>

      {/* Form container with decorative corners */}
      <div className="bg-skin-primary rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-skin-accent relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-skin-accent rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-skin-accent rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-skin-accent rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-skin-accent rounded-br-xl"></div>

        {/* Title */}
        <h2 className="text-4xl font-bold mb-2 text-skin-primary font-serif text-center">
          {title}
        </h2>

        {/* Optional subtitle */}
        {subtitle && (
          <p className="text-sm text-skin-secondary text-center mb-6">{subtitle}</p>
        )}

        {/* Form content */}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </div>
  );
}
