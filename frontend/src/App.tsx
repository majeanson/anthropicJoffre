import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card } from './types/game';
import { Lobby } from './components/Lobby';
import { BettingPhase } from './components/BettingPhase';
import { PlayingPhase } from './components/PlayingPhase';
import { TeamSelection } from './components/TeamSelection';
import { DebugMultiPlayerView } from './components/DebugMultiPlayerView';
import { DebugPanel } from './components/DebugPanel';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('game_created', ({ gameId, gameState }) => {
      setGameId(gameId);
      setGameState(gameState);
    });

    newSocket.on('player_joined', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('round_started', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game_updated', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('trick_resolved', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('round_ended', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game_over', ({ winningTeam, gameState }) => {
      setGameState(gameState);
      alert(`Game Over! Team ${winningTeam} wins!`);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    newSocket.on('player_left', ({ gameState }) => {
      setGameState(gameState);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateGame = (playerName: string) => {
    if (socket) {
      socket.emit('create_game', playerName);
    }
  };

  const handleJoinGame = (gameId: string, playerName: string) => {
    if (socket) {
      socket.emit('join_game', { gameId, playerName });
      setGameId(gameId);
    }
  };

  const handlePlaceBet = (amount: number, withoutTrump: boolean, skipped?: boolean) => {
    if (socket && gameId) {
      socket.emit('place_bet', { gameId, amount, withoutTrump, skipped });
    }
  };

  const handlePlayCard = (card: Card) => {
    if (socket && gameId) {
      socket.emit('play_card', { gameId, card });
    }
  };

  const handleSelectTeam = (teamId: 1 | 2) => {
    if (socket && gameId) {
      socket.emit('select_team', { gameId, teamId });
    }
  };

  const handleSwapPosition = (targetPlayerId: string) => {
    if (socket && gameId) {
      socket.emit('swap_position', { gameId, targetPlayerId });
    }
  };

  const handleStartGame = () => {
    if (socket && gameId) {
      socket.emit('start_game', { gameId });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => {
              setError('');
              setGameState(null);
              setGameId('');
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />;
  }

  // Debug controls (always available, even in production)
  const DebugControls = () => (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => setDebugPanelOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold transition-colors flex items-center gap-2"
        title="Open Debug Panel"
        aria-label="Open debug panel to inspect game state"
      >
        🔍 State
      </button>
      {gameState && gameState.players.length === 4 && (
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold transition-colors"
          title="Toggle 4-Player Debug View"
          aria-label={debugMode ? 'Switch to single player view' : 'Switch to 4-player debug view'}
        >
          {debugMode ? '👤 Single' : '🐛 4-Player'}
        </button>
      )}
    </div>
  );

  // If debug mode is enabled, use the multi-player view
  if (debugMode && gameState.players.length === 4) {
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <DebugMultiPlayerView
          gameState={gameState}
          gameId={gameId}
          onPlaceBet={handlePlaceBet}
          onPlayCard={handlePlayCard}
          onSelectTeam={handleSelectTeam}
          onSwapPosition={handleSwapPosition}
          onStartGame={handleStartGame}
        />
      </>
    );
  }

  if (gameState.phase === 'team_selection') {
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <TeamSelection
          players={gameState.players}
          gameId={gameId}
          currentPlayerId={socket?.id || ''}
          onSelectTeam={handleSelectTeam}
          onSwapPosition={handleSwapPosition}
          onStartGame={handleStartGame}
        />
      </>
    );
  }

  if (gameState.phase === 'betting') {
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-amber-900 flex items-center justify-center p-6">
          <BettingPhase
            players={gameState.players}
            currentBets={gameState.currentBets}
            currentPlayerId={socket?.id || ''}
            currentPlayerIndex={gameState.currentPlayerIndex}
            dealerIndex={gameState.dealerIndex}
            onPlaceBet={handlePlaceBet}
          />
        </div>
      </>
    );
  }

  if (gameState.phase === 'playing') {
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <PlayingPhase
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
          onPlayCard={handlePlayCard}
        />
      </>
    );
  }

  if (gameState.phase === 'scoring') {
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-2xl w-full">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Round {gameState.roundNumber} Complete!</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Team 1</h3>
              <p className="text-4xl font-bold text-blue-600">{gameState.teamScores.team1}</p>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Team 2</h3>
              <p className="text-4xl font-bold text-red-600">{gameState.teamScores.team2}</p>
            </div>
          </div>
          <div className="space-y-2">
            {gameState.players.map((player) => {
              const bet = gameState.currentBets.find(b => b.playerId === player.id);
              return (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
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
      </>
    );
  }

  if (gameState.phase === 'game_over') {
    const winningTeam = gameState.teamScores.team1 >= 41 ? 1 : 2;
    return (
      <>
        <DebugControls />
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <div className="min-h-screen bg-gradient-to-br from-yellow-900 to-orange-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-2xl w-full text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Game Over!</h2>
          <div className={`text-6xl font-bold mb-6 ${winningTeam === 1 ? 'text-blue-600' : 'text-red-600'}`}>
            Team {winningTeam} Wins!
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Team 1</h3>
              <p className="text-4xl font-bold text-blue-600">{gameState.teamScores.team1}</p>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Team 2</h3>
              <p className="text-4xl font-bold text-red-600">{gameState.teamScores.team2}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setGameState(null);
              setGameId('');
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
        </div>
      </>
    );
  }

  return null;
}

export default App;
