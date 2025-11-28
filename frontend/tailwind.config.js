/**
 * Tailwind CSS Configuration
 * Sprint 21: Enhanced with design token system
 *
 * Design tokens available at: frontend/src/design-system/
 * - colors.ts - Standardized color palette and gradients
 * - typography.ts - Typography scale
 * - spacing.ts - Spacing scale
 * - shadows.ts - Shadow definitions
 * - breakpoints.ts - Responsive breakpoints
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Historic theme colors inspired by traditional card game aesthetics
        // Note: Design token system available at frontend/src/design-system/colors.ts
        parchment: {
          50: '#FDFCFA',
          100: '#F9F7F3',
          200: '#F5F1E8',
          300: '#EBE4D7',
          400: '#DFD5C3',
          500: '#D1C4AE',
          600: '#B8A88E',
          700: '#9A8A73',
          800: '#7A6D5C',
          900: '#5C5349',
        },
        crimson: {
          50: '#FDF2F2',
          100: '#FBE4E4',
          200: '#F7C9C9',
          300: '#F19B9B',
          400: '#E76262',
          500: '#D63939',
          600: '#B82020',
          700: '#9A1818',
          800: '#7D1616',
          900: '#641616',
        },
        umber: {
          50: '#FBF8F5',
          100: '#F5EFE7',
          200: '#E8DBC9',
          300: '#D9C1A1',
          400: '#C79F6E',
          500: '#B8864D',
          600: '#A06730',
          700: '#85532A',
          800: '#6D4427',
          900: '#5A3922',
        },
        forest: {
          50: '#F4F8F5',
          100: '#E6F1E9',
          200: '#CCE3D2',
          300: '#A5CFAF',
          400: '#72B384',
          500: '#4A9760',
          600: '#357A49',
          700: '#2B633D',
          800: '#254F33',
          900: '#1F422B',
        },
        sapphire: {
          50: '#F2F6FB',
          100: '#E3EDF8',
          200: '#C1D9F0',
          300: '#8EBCE5',
          400: '#5499D6',
          500: '#2E79C2',
          600: '#1F5FA4',
          700: '#1A4C85',
          800: '#18406E',
          900: '#18365B',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      keyframes: {
        'slide-from-bottom': {
          '0%': { transform: 'translateY(300px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-from-top': {
          '0%': { transform: 'translateY(-300px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-from-left': {
          '0%': { transform: 'translateX(-300px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-from-right': {
          '0%': { transform: 'translateX(300px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'collect-to-bottom': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(200px) scale(0.5)', opacity: '0' },
        },
        'collect-to-top': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(-200px) scale(0.5)', opacity: '0' },
        },
        'collect-to-left': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateX(-200px) scale(0.5)', opacity: '0' },
        },
        'collect-to-right': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateX(200px) scale(0.5)', opacity: '0' },
        },
        'score-pop': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'points-float-up': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
        'slideDown': {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fadeInUp': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeInDown': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'card-play-arc': {
          '0%': {
            transform: 'translateY(0) translateX(0) scale(1) rotate(0deg)',
            opacity: '1'
          },
          '50%': {
            transform: 'translateY(0) translateX(0) scale(0.95) rotate(0deg)',
            opacity: '0.5'
          },
          '100%': {
            transform: 'translateY(0) translateX(0) scale(0.9) rotate(0deg)',
            opacity: '0'
          }
        },
        'card-hover-lift': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(-8px) scale(1.05)' },
        },
        'ghost-fade': {
          '0%': { opacity: '0.3' },
          '100%': { opacity: '0' },
        },
        'special-card-glow': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
            transform: 'scale(1.02)'
          },
        },
        // Sprint 1 Phase 1: Card hover effects
        'card-glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(74, 222, 128, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.7)' },
        },
        'card-preview-zoom': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'selection-ring': {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 0 5px rgba(59, 130, 246, 0.8)' },
        },
        // Sprint 1 Phase 2: Play confirmation animations
        'card-play-confirm': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'particle-burst': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'var(--particle-x) var(--particle-y) scale(0)', opacity: '0' },
        },
        // Sprint 1 Phase 3: Trick winner celebrations
        'confetti-fall': {
          '0%': {
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0.3'
          }
        },
        'crown-bounce': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.2)' }
        },
        'screen-flash': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.3' }
        },
        'trophy-rotate': {
          '0%': { transform: 'rotateY(0deg) scale(1)' },
          '50%': { transform: 'rotateY(180deg) scale(1.1)' },
          '100%': { transform: 'rotateY(360deg) scale(1)' }
        },
        // Sprint 1 Phase 4: Score change animations
        'score-flash-green': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(34, 197, 94, 0.3)' }
        },
        'score-flash-red': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' }
        },
        'plus-minus-float': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-30px)', opacity: '0' }
        },
        // Sprint 1 Phase 5: Enhanced turn indicators
        'turn-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)'
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(59, 130, 246, 0)',
            borderColor: 'rgba(59, 130, 246, 0.5)'
          }
        },
        'spotlight': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' }
        },
        'arrow-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        // Sprint 3 Phase 3.5: Notification animations
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '15%': { transform: 'translateY(-20px)' },
          '30%': { transform: 'translateY(0)' },
          '45%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(0)' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'progress-fill': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        // Polish: Suggestion button entrance
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-from-bottom': 'slide-from-bottom 0.4s ease-out',
        'slide-from-top': 'slide-from-top 0.4s ease-out',
        'slide-from-left': 'slide-from-left 0.4s ease-out',
        'slide-from-right': 'slide-from-right 0.4s ease-out',
        'collect-to-bottom': 'collect-to-bottom 1s ease-in-out forwards',
        'collect-to-top': 'collect-to-top 1s ease-in-out forwards',
        'collect-to-left': 'collect-to-left 1s ease-in-out forwards',
        'collect-to-right': 'collect-to-right 1s ease-in-out forwards',
        'score-pop': 'score-pop 0.5s ease-out',
        'points-float-up': 'points-float-up 2s ease-out forwards',
        'slideDown': 'slideDown 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'fadeIn': 'fadeIn 0.2s ease-in',
        'fadeInUp': 'fadeInUp 0.5s ease-out',
        'fadeInDown': 'fadeInDown 0.5s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'card-play-arc': 'card-play-arc 0.6s ease-out forwards',
        'card-hover-lift': 'card-hover-lift 0.15s ease-out forwards',
        'ghost-fade': 'ghost-fade 0.4s ease-out forwards',
        'special-card-glow': 'special-card-glow 2s ease-in-out infinite',
        // Sprint 1 Phase 1: Card hover effects
        'card-glow-pulse': 'card-glow-pulse 1.5s ease-in-out infinite',
        'card-preview-zoom': 'card-preview-zoom 0.2s ease-out',
        'selection-ring': 'selection-ring 1s ease-in-out infinite',
        // Sprint 1 Phase 2: Play confirmation animations
        'card-play-confirm': 'card-play-confirm 0.3s ease-out',
        'particle-burst': 'particle-burst 0.6s ease-out forwards',
        // Sprint 1 Phase 3: Trick winner celebrations
        'confetti-fall': 'confetti-fall 3s linear forwards',
        'crown-bounce': 'crown-bounce 0.6s ease-in-out infinite',
        'screen-flash': 'screen-flash 0.5s ease-out',
        'trophy-rotate': 'trophy-rotate 1s ease-in-out',
        // Sprint 1 Phase 4: Score change animations
        'score-flash-green': 'score-flash-green 0.5s ease-out',
        'score-flash-red': 'score-flash-red 0.5s ease-out',
        'plus-minus-float': 'plus-minus-float 1.5s ease-out forwards',
        // Sprint 1 Phase 5: Enhanced turn indicators
        'turn-pulse': 'turn-pulse 2s ease-in-out infinite',
        'spotlight': 'spotlight 2s ease-in-out infinite',
        'arrow-bounce': 'arrow-bounce 1s ease-in-out infinite',
        // Sprint 3 Phase 3.5: Notification animations
        'bounce-once': 'bounce-once 0.5s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
        'progress-fill': 'progress-fill 5s linear forwards',
        // Polish: Suggestion button entrance
        'fade-in-scale': 'fade-in-scale 0.3s ease-out',
      },
    },
  },
  plugins: [
    // Add prefers-reduced-motion support
    function({ addVariant }) {
      addVariant('motion-safe', '@media (prefers-reduced-motion: no-preference)');
      addVariant('motion-reduce', '@media (prefers-reduced-motion: reduce)');
    },
  ],
}
