import { useSettings } from '../contexts/SettingsContext';

export function DarkModeToggle() {
  const { darkMode, setDarkMode } = useSettings();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 border-gray-900 shadow-lg transform hover:scale-105 flex items-center gap-2"
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
      <span className="hidden md:inline">{darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}</span>
    </button>
  );
}
