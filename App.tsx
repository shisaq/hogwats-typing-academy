import React, { useState, useEffect } from 'react';
import { GameState, House, GameStatus } from './types';
import SortingHat from './components/SortingHat';
import TypingGame from './components/TypingGame';
import UserManager from './components/UserManager';
import * as storageService from './services/storageService';
import { soundEffects } from './services/soundEffects';
import { Volume2, VolumeX, RotateCcw, LogOut, Users, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [house, setHouse] = useState<House>(House.Unsorted);
  const [maxLevel, setMaxLevel] = useState<number>(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.Menu);
  const [muted, setMuted] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const loadUserData = () => {
    const username = storageService.getCurrentUser();
    setCurrentUsername(username);

    if (username) {
      const progress = storageService.getProgress();
      setHouse(progress.house);
      setMaxLevel(progress.maxLevel);
    } else {
      setHouse(House.Unsorted);
      setMaxLevel(1);
      setShowUserManager(true);
    }
  };

  useEffect(() => {
    loadUserData();

    // Global audio warmup
    const warmup = () => {
      soundEffects.warmup();
      document.removeEventListener('click', warmup);
      document.removeEventListener('keydown', warmup);
      document.removeEventListener('touchstart', warmup);
      document.removeEventListener('mousedown', warmup);
    };
    document.addEventListener('click', warmup);
    document.addEventListener('keydown', warmup);
    document.addEventListener('touchstart', warmup);
    document.addEventListener('mousedown', warmup);

    return () => {
      document.removeEventListener('click', warmup);
      document.removeEventListener('keydown', warmup);
      document.removeEventListener('touchstart', warmup);
      document.removeEventListener('mousedown', warmup);
    };
  }, []);

  const startGame = () => {
    if (!currentUsername) {
      setShowUserManager(true);
      return;
    }
    soundEffects.playButtonClick();
    soundEffects.playLevelStart();
    setStatus(GameStatus.Playing);
  };

  const handleSorted = (selectedHouse: House) => {
    setHouse(selectedHouse);
    storageService.saveProgress({ house: selectedHouse });
    soundEffects.playHouseReveal(selectedHouse.toLowerCase() as 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff');
    setStatus(GameStatus.Menu);
  };

  const handleGameEnd = (finalState: GameState) => {
    setGameState(finalState);
    if (finalState.level > maxLevel) {
      setMaxLevel(finalState.level);
      storageService.saveProgress({ maxLevel: finalState.level });
    }
    setStatus(GameStatus.Results);
  };

  const restartGame = () => {
    soundEffects.playButtonClick();
    soundEffects.playLevelStart();
    setStatus(GameStatus.Playing);
  };

  const handleReset = () => {
    soundEffects.playButtonClick();
    if (window.confirm("Are you sure you want to reset your progress?")) {
      storageService.clearProgress();
      setHouse(House.Unsorted);
      setMaxLevel(1);
      setGameState(null);
      setStatus(GameStatus.Menu);
      soundEffects.playNotification();
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    soundEffects.setMuted(newMuted);
    if (!newMuted) soundEffects.playButtonClick();
  };

  const handleLogout = () => {
    soundEffects.playButtonClick();
    const data = localStorage.getItem('hogwarts_typing_academy_v2');
    if (data) {
      const parsed = JSON.parse(data);
      parsed.currentUser = null;
      localStorage.setItem('hogwarts_typing_academy_v2', JSON.stringify(parsed));
    }
    setCurrentUsername(null);
    setHouse(House.Unsorted);
    setMaxLevel(1);
    setStatus(GameStatus.Menu);
    setShowUserManager(true);
  };

  const getHouseBadge = () => {
    switch (house) {
      case House.Gryffindor: return { color: '#ff6b6b', icon: '🦁' };
      case House.Slytherin: return { color: '#69db7c', icon: '🐍' };
      case House.Ravenclaw: return { color: '#74c0fc', icon: '🦅' };
      case House.Hufflepuff: return { color: '#ffd43b', icon: '🦡' };
      default: return { color: '#adb5bd', icon: '❓' };
    }
  };

  return (
    <div className="app-container">
      {/* Ancient Parchment Background */}
      <div className="ancient-bg"></div>
      <div className="magic-embers"></div>

      {/* Ancient Academy Navigation */}
      <nav className="academy-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">🧙</div>
          <span>Hogwarts Typing Academy</span>
        </div>

        <div className="nav-actions">
          {/* Current User */}
          {currentUsername && (
            <div className="nav-user" onClick={() => setShowUserManager(true)}>
              <span className="nav-user-avatar">{currentUsername.charAt(0).toUpperCase()}</span>
              <span>{currentUsername}</span>
            </div>
          )}

          {/* Volume Toggle */}
          <button
            className={`nav-btn ${muted ? 'active' : ''}`}
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* User Manager */}
          <button
            className="nav-btn"
            onClick={() => setShowUserManager(true)}
            title="Switch User"
          >
            <Users size={18} />
          </button>

          {/* Reset Progress */}
          {currentUsername && house !== House.Unsorted && (
            <button
              className="nav-btn"
              onClick={handleReset}
              title="Reset Progress"
            >
              <RotateCcw size={18} />
            </button>
          )}

          {/* Logout */}
          {currentUsername && (
            <button
              className="nav-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="academy-content">
        {!currentUsername || showUserManager ? (
          <UserManager
            onUserChange={() => {
              loadUserData();
              setShowUserManager(false);
            }}
          />
        ) : (
          <>
            {status === GameStatus.Menu && house === House.Unsorted && (
              <div className="float-animation">
                <SortingHat onSorted={handleSorted} />
              </div>
            )}

            {status === GameStatus.Menu && house !== House.Unsorted && (
              <div className="ancient-card max-w-md mx-auto p-8 text-center space-y-6 float-animation">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="text-amber-600" size={24} />
                  <h2 className="text-2xl font-display text-ink-brown">
                    Welcome back, {currentUsername}
                  </h2>
                </div>

                <div className="p-6 rounded bg-gradient-to-b from-amber-50 to-amber-100/50 border-2 border-ink-brown/20">
                  <p className="text-sm text-ink-brown/60 uppercase tracking-wider mb-2 font-heading">Current Level</p>
                  <p className="text-5xl font-display text-ink-brown">{maxLevel}</p>
                </div>

                <button
                  onClick={startGame}
                  className="ancient-btn w-full"
                >
                  <span>Enter Classroom</span>
                </button>
              </div>
            )}

            {status === GameStatus.Playing && (
              <TypingGame
                house={house}
                onEndGame={handleGameEnd}
                initialLevel={gameState ? gameState.level : maxLevel}
              />
            )}

            {status === GameStatus.Results && gameState && (
              <div className="ancient-card max-w-lg mx-auto p-10 text-center space-y-6 float-animation">
                <h2 className="text-4xl font-display text-ink-brown mb-4">
                  Class Dismissed!
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded bg-gradient-to-br from-green-50 to-emerald-100/50 border-2 border-green-800/20">
                    <p className="text-xs uppercase tracking-wide text-green-800/60 mb-2 font-heading">Accuracy</p>
                    <p className="text-4xl font-display text-green-800">{gameState.accuracy}%</p>
                  </div>
                  <div className="p-6 rounded bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-800/20">
                    <p className="text-xs uppercase tracking-wide text-blue-800/60 mb-2 font-heading">Speed</p>
                    <p className="text-4xl font-display text-blue-800">{gameState.wpm}</p>
                    <p className="text-sm text-blue-800/60">WPM</p>
                  </div>
                </div>

                <div className="p-6 rounded bg-gradient-to-br from-amber-50 to-yellow-100/50 border-2 border-amber-800/20">
                  <p className="font-display text-xl text-amber-800">
                    {gameState.accuracy > 90 ? "Outstanding! ✨" : gameState.accuracy > 70 ? "Exceeds Expectations" : "Acceptable"}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStatus(GameStatus.Menu)}
                    className="ancient-btn flex-1"
                  >
                    Return Home
                  </button>
                  <button
                    onClick={restartGame}
                    className="ancient-btn ancient-btn-seal flex-1"
                  >
                    Next Level
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
