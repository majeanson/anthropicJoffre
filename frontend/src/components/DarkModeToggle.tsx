import { useSettings } from '../contexts/SettingsContext';
import { colors } from '../design-system';

export function DarkModeToggle() {
  const { darkMode, setDarkMode } = useSettings();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`bg-gradient-to-r ${colors.gradients.neutral} hover:${colors.gradients.neutralHover} text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 border-gray-900 shadow-lg transform hover:scale-105 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500`}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-pressed={darkMode}
    >
      <span className="text-xl" aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
      <span className="hidden md:inline">{darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}</span>
    </button>
  );
}
