const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');
const lines = content.split('\n');

// Find the line with BeginnerTutorial
const insertIndex = lines.findIndex(line => line.includes('BeginnerTutorial'));

// Insert quest imports after BeginnerTutorial
const questImports = [
  "// Sprint 19: Quest system components",
  "const DailyQuestsPanel = lazy(() => import('./components/DailyQuestsPanel').then(m => ({ default: m.DailyQuestsPanel })));",
  "const LoginStreakBadge = lazy(() => import('./components/LoginStreakBadge').then(m => ({ default: m.LoginStreakBadge })));",
  "const RewardsCalendar = lazy(() => import('./components/RewardsCalendar').then(m => ({ default: m.RewardsCalendar })));"
];

lines.splice(insertIndex + 1, 0, ...questImports);
fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('Added quest imports');
