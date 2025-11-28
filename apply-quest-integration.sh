#!/bin/bash
# Quest System Integration Script
# Sprint 19: Daily Engagement System
# This script applies all necessary changes to integrate the quest system

set -e  # Exit on error

echo "🔧 Applying Quest System Integration..."

# Backup files first
echo "📦 Creating backups..."
cp frontend/src/App.tsx frontend/src/App.tsx.backup
cp frontend/src/components/GlobalUI.tsx frontend/src/components/GlobalUI.tsx.backup
cp frontend/src/components/Lobby.tsx frontend/src/components/Lobby.tsx.backup
cp frontend/src/components/StatsPanel.tsx frontend/src/components/StatsPanel.tsx.backup

# Apply changes using awk for better multiline handling

echo "1️⃣ Updating App.tsx..."
awk '
/const BeginnerTutorial = lazy/ {
    print
    print "// Sprint 19: Quest system components"
    print "const DailyQuestsPanel = lazy(() => import('\''./components/DailyQuestsPanel'\'').then(m => ({ default: m.DailyQuestsPanel })));"
    print "const LoginStreakBadge = lazy(() => import('\''./components/LoginStreakBadge'\'').then(m => ({ default: m.LoginStreakBadge })));"
    print "const RewardsCalendar = lazy(() => import('\''./components/RewardsCalendar'\'').then(m => ({ default: m.RewardsCalendar })));"
    next
}
/const \[showKeyboardShortcuts, setShowKeyboardShortcuts\] = useState\(false\);/ {
    print
    print ""
    print "  // Sprint 19: Quest system state"
    print "  const [showQuestsPanel, setShowQuestsPanel] = useState(false);"
    print "  const [showRewardsCalendar, setShowRewardsCalendar] = useState(false);"
    next
}
/}, \[gameState\]\);$/ && !done1 {
    print
    print ""
    print "  // Sprint 19: Update login streak when player connects"
    print "  useEffect(() => {"
    print "    if (socket && currentPlayerName) {"
    print "      socket.emit('\''update_login_streak'\'', { playerName: currentPlayerName });"
    print "    }"
    print "  }, [socket, currentPlayerName]);"
    done1=1
    next
}
/^    socket$/ && /globalUIProps/ {
    print "    socket,"
    print "    showQuestsPanel,"
    print "    setShowQuestsPanel,"
    print "    showRewardsCalendar,"
    print "    setShowRewardsCalendar,"
    print "    currentPlayerName"
    next
}
/onBotDifficultyChange=\{setBotDifficulty\}/ {
    print
    print "          onShowQuests={() => setShowQuestsPanel(true)}"
    print "          onShowRewardsCalendar={() => setShowRewardsCalendar(true)}"
    next
}
{ print }
' frontend/src/App.tsx.backup > frontend/src/App.tsx

echo "2️⃣ Updating GlobalUI.tsx..."
awk '
/const NotificationCenter = lazy/ {
    print
    print "const DailyQuestsPanel = lazy(() => import('\''./DailyQuestsPanel'\'').then(m => ({ default: m.DailyQuestsPanel })));"
    print "const RewardsCalendar = lazy(() => import('\''./RewardsCalendar'\'').then(m => ({ default: m.RewardsCalendar })));"
    next
}
/socket: Socket \| null;$/ && /interface GlobalUIProps/ {
    print
    print "  showQuestsPanel: boolean;"
    print "  setShowQuestsPanel: (show: boolean) => void;"
    print "  showRewardsCalendar: boolean;"
    print "  setShowRewardsCalendar: (show: boolean) => void;"
    print "  currentPlayerName: string;"
    next
}
/^  socket$/ && !done2 {
    print "  socket,"
    print "  showQuestsPanel,"
    print "  setShowQuestsPanel,"
    print "  showRewardsCalendar,"
    print "  setShowRewardsCalendar,"
    print "  currentPlayerName,"
    done2=1
    next
}
/<\/Suspense>/ && /FriendsPanel/ && !done3 {
    print
    print ""
    print "      {/* Sprint 19: Quest System Modals */}"
    print "      <Suspense fallback={<div />}>"
    print "        <DailyQuestsPanel"
    print "          socket={socket}"
    print "          playerName={currentPlayerName}"
    print "          isOpen={showQuestsPanel}"
    print "          onClose={() => setShowQuestsPanel(false)}"
    print "        />"
    print "        <RewardsCalendar"
    print "          socket={socket}"
    print "          playerName={currentPlayerName}"
    print "          isOpen={showRewardsCalendar}"
    print "          onClose={() => setShowRewardsCalendar(false)}"
    print "        />"
    print "      </Suspense>"
    done3=1
    next
}
{ print }
' frontend/src/components/GlobalUI.tsx.backup > frontend/src/components/GlobalUI.tsx

echo "3️⃣ Updating Lobby.tsx..."
awk '
/onShowRegister\?: \(\) => void;/ {
    print
    print "  onShowQuests?: () => void;"
    print "  onShowRewardsCalendar?: () => void;"
    next
}
/export function Lobby.*onShowRegister/ {
    gsub(/onShowRegister \}: LobbyProps\)/, "onShowRegister, onShowQuests, onShowRewardsCalendar }: LobbyProps)")
    print
    next
}
/setShowBrowser=\{setShowBrowser\}/ && /StatsPanel/ {
    print
    print "                    onShowQuests={onShowQuests}"
    print "                    onShowRewardsCalendar={onShowRewardsCalendar}"
    next
}
{ print }
' frontend/src/components/Lobby.tsx.backup > frontend/src/components/Lobby.tsx

echo "4️⃣ Updating StatsPanel.tsx..."
awk '
/setShowBrowser: \(show: boolean\) => void;/ && /interface StatsPanelProps/ {
    print
    print "  onShowQuests?: () => void;"
    print "  onShowRewardsCalendar?: () => void;"
    next
}
/setShowBrowser,$/ && !done4 {
    print
    print "  onShowQuests,"
    print "  onShowRewardsCalendar,"
    done4=1
    next
}
/Recent Games/ && /<span/ && !done5 {
    print
    getline
    print
    print ""
    print "          {/* Sprint 19: Quest System Buttons */}"
    print "          {onShowQuests && ("
    print "            <button"
    print "              data-keyboard-nav=\"daily-quests\""
    print "              onClick={() => {"
    print "                sounds.buttonClick();"
    print "                onShowQuests();"
    print "              }}"
    print "              className=\"w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-700 transition-all duration-200 border border-blue-800 dark:border-purple-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2\""
    print "            >"
    print "              <span className=\"text-xl\">📋</span>"
    print "              Daily Quests"
    print "            </button>"
    print "          )}"
    print ""
    print "          {onShowRewardsCalendar && ("
    print "            <button"
    print "              data-keyboard-nav=\"rewards-calendar\""
    print "              onClick={() => {"
    print "                sounds.buttonClick();"
    print "                onShowRewardsCalendar();"
    print "              }}"
    print "              className=\"w-full bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-700 dark:to-orange-800 text-white py-4 rounded-lg font-bold hover:from-pink-700 hover:to-orange-700 dark:hover:from-pink-600 dark:hover:to-orange-700 transition-all duration-200 border border-pink-800 dark:border-orange-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2\""
    print "            >"
    print "              <span className=\"text-xl\">🎁</span>"
    print "              Rewards Calendar"
    print "            </button>"
    print "          )}"
    done5=1
    next
}
{ print }
' frontend/src/components/StatsPanel.tsx.backup > frontend/src/components/StatsPanel.tsx

echo "✅ Integration complete!"
echo ""
echo "🧪 Testing build..."
cd frontend && npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🗑️  Removing backups..."
    rm frontend/src/App.tsx.backup
    rm frontend/src/components/GlobalUI.tsx.backup
    rm frontend/src/components/Lobby.tsx.backup
    rm frontend/src/components/StatsPanel.tsx.backup
else
    echo "❌ Build failed! Restoring backups..."
    mv frontend/src/App.tsx.backup frontend/src/App.tsx
    mv frontend/src/components/GlobalUI.tsx.backup frontend/src/components/GlobalUI.tsx
    mv frontend/src/components/Lobby.tsx.backup frontend/src/components/Lobby.tsx
    mv frontend/src/components/StatsPanel.tsx.backup frontend/src/components/StatsPanel.tsx
    exit 1
fi

echo ""
echo "🎉 Quest System Integration Complete!"
echo "📝 Run 'cd backend && npm run db:migrate' to set up the database"
echo "🚀 Run 'npm run dev' in both backend and frontend to test"
