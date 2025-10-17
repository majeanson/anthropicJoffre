import { GameState, Card } from '../types/game';
import { BettingPhase } from './BettingPhase';
import { PlayingPhase } from './PlayingPhase';
import { TeamSelection } from './TeamSelection';

interface DebugMultiPlayerViewProps {
  gameState: GameState;
  gameId: string;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped?: boolean) => void;
  onPlayCard: (card: Card) => void;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
}

export function DebugMultiPlayerView({
  gameState,
  gameId,
  onPlaceBet,
  onPlayCard,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
}: DebugMultiPlayerViewProps) {
  const players = gameState.players;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="mb-4 bg-yellow-100 border-2 border-yellow-600 rounded-lg p-3 text-center">
        <h2 className="text-lg font-bold text-yellow-900">🐛 DEBUG MODE - 4 Player View</h2>
        <p className="text-sm text-yellow-800">Each panel shows the game from that player's perspective</p>
      </div>

      {/* Team Selection Phase */}
      {gameState.phase === 'team_selection' && (
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <div key={player.id} className="border-4 border-purple-500 rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white px-4 py-2 font-bold">
                {player.name}
              </div>
              <div className="bg-white">
                <TeamSelection
                  players={players}
                  gameId={gameId}
                  currentPlayerId={player.id}
                  onSelectTeam={onSelectTeam}
                  onSwapPosition={onSwapPosition}
                  onStartGame={onStartGame}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Betting Phase */}
      {gameState.phase === 'betting' && (
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <div key={player.id} className="border-4 border-orange-500 rounded-lg overflow-hidden">
              <div className={`px-4 py-2 font-bold text-white ${
                gameState.currentPlayerIndex === players.indexOf(player)
                  ? 'bg-green-600 animate-pulse'
                  : 'bg-orange-600'
              }`}>
                {player.name} {gameState.currentPlayerIndex === players.indexOf(player) ? '(TURN)' : ''}
              </div>
              <div className="bg-gradient-to-br from-orange-900 to-amber-900 p-4">
                <BettingPhase
                  players={players}
                  currentBets={gameState.currentBets}
                  currentPlayerId={player.id}
                  currentPlayerIndex={gameState.currentPlayerIndex}
                  dealerIndex={gameState.dealerIndex}
                  onPlaceBet={onPlaceBet}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playing Phase */}
      {gameState.phase === 'playing' && (
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <div key={player.id} className="border-4 border-green-500 rounded-lg overflow-hidden">
              <div className={`px-4 py-2 font-bold text-white ${
                gameState.currentPlayerIndex === players.indexOf(player)
                  ? 'bg-green-600 animate-pulse'
                  : 'bg-orange-600'
              }`}>
                {player.name} {gameState.currentPlayerIndex === players.indexOf(player) ? '(TURN)' : ''}
              </div>
              <div className="bg-gray-100" style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '118%', height: '118%' }}>
                <PlayingPhase
                  gameState={gameState}
                  currentPlayerId={player.id}
                  onPlayCard={onPlayCard}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scoring Phase */}
      {gameState.phase === 'scoring' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Round {gameState.roundNumber} Complete!
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Team 1</h3>
                <p className="text-4xl font-bold text-orange-600">{gameState.teamScores.team1}</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Team 2</h3>
                <p className="text-4xl font-bold text-purple-600">{gameState.teamScores.team2}</p>
              </div>
            </div>
            <div className="space-y-2">
              {players.map((player) => {
                const bet = gameState.currentBets.find(b => b.playerId === player.id);
                return (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'}`}></span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="text-sm">
                      <span>Bet: {bet?.amount} pts | Earned: {player.pointsWon} pts ({player.tricksWon} tricks)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-gray-600">Next round starting soon...</p>
          </div>
        </div>
      )}

      {/* Game Over Phase */}
      {gameState.phase === 'game_over' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Game Over!</h2>
            <div className={`text-6xl font-bold mb-6 ${
              gameState.teamScores.team1 >= 41 ? 'text-orange-600' : 'text-purple-600'
            }`}>
              Team {gameState.teamScores.team1 >= 41 ? 1 : 2} Wins!
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Team 1</h3>
                <p className="text-4xl font-bold text-orange-600">{gameState.teamScores.team1}</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Team 2</h3>
                <p className="text-4xl font-bold text-purple-600">{gameState.teamScores.team2}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
