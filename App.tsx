import React, { useState, useEffect } from 'react';
import { GameState, House, GameStatus, WordChallenge, WordPracticeStats } from './types';
import SortingHat from './components/SortingHat';
import TypingGame from './components/TypingGame';
import UserManager from './components/UserManager';
import Spellbook from './components/Spellbook';
import * as storageService from './services/storageService';
import { CurriculumStats, getCurriculumStats, getLevelInfo, getWeakPracticeChallenges, getYearCompletionInfo, TOTAL_LEVELS } from './services/gameContentService';
import { soundEffects } from './services/soundEffects';
import { BookOpen, Volume2, VolumeX, RotateCcw, LogOut, Users, Sparkles, Wand2 } from 'lucide-react';

const App: React.FC = () => {
  const [house, setHouse] = useState<House>(House.Unsorted);
  const [maxLevel, setMaxLevel] = useState<number>(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.Menu);
  const [muted, setMuted] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [learningStats, setLearningStats] = useState<CurriculumStats>(() => getCurriculumStats());
  const [wordStats, setWordStats] = useState<Record<string, WordPracticeStats>>({});
  const [graduated, setGraduated] = useState<boolean>(false);
  const [showSpellbook, setShowSpellbook] = useState(false);
  const [reviewChallenges, setReviewChallenges] = useState<WordChallenge[] | null>(null);

  const loadUserData = () => {
    const username = storageService.getCurrentUser();
    setCurrentUsername(username);

    if (username) {
      const progress = storageService.getProgress();
      setHouse(progress.house);
      setMaxLevel(Math.min(progress.maxLevel, TOTAL_LEVELS));
      setLearningStats(getCurriculumStats(progress.wordStats));
      setWordStats(progress.wordStats);
      setGraduated(progress.graduated);
    } else {
      setHouse(House.Unsorted);
      setMaxLevel(1);
      setLearningStats(getCurriculumStats());
      setWordStats({});
      setGraduated(false);
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
    setShowSpellbook(false);
    setReviewChallenges(null);
    setStatus(GameStatus.Playing);
  };

  const startWeakPractice = () => {
    const challenges = getWeakPracticeChallenges(wordStats);
    if (challenges.length === 0) return;

    soundEffects.playButtonClick();
    soundEffects.playLevelStart();
    setShowSpellbook(false);
    setReviewChallenges(challenges);
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
    if (finalState.isReview) {
      // Review sessions update word stats but do not unlock curriculum lessons.
    } else if (finalState.isGraduated) {
      setMaxLevel(TOTAL_LEVELS);
      setGraduated(true);
      storageService.saveProgress({ maxLevel: TOTAL_LEVELS, graduated: true });
    } else if (finalState.level > maxLevel) {
      setMaxLevel(finalState.level);
      storageService.saveProgress({ maxLevel: finalState.level });
    }
    const progress = storageService.getProgress();
    setLearningStats(getCurriculumStats(progress.wordStats));
    setWordStats(progress.wordStats);
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
      setLearningStats(getCurriculumStats());
      setWordStats({});
      setGraduated(false);
      setShowSpellbook(false);
      setReviewChallenges(null);
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
    setLearningStats(getCurriculumStats());
    setWordStats({});
    setGraduated(false);
    setShowSpellbook(false);
    setReviewChallenges(null);
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

  const currentLesson = getLevelInfo(maxLevel);
  const weakPracticeCount = getWeakPracticeChallenges(wordStats).length;
  const completedYear = gameState && !gameState.isReview ? getYearCompletionInfo(gameState.completedLevel) : null;

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
              setShowSpellbook(false);
              setReviewChallenges(null);
            }}
          />
        ) : (
          <>
            {showSpellbook && house !== House.Unsorted && (
              <Spellbook
                wordStats={wordStats}
                onBack={() => {
                  soundEffects.playButtonClick();
                  setShowSpellbook(false);
                }}
              />
            )}

            {status === GameStatus.Menu && house === House.Unsorted && (
              <div className="float-animation">
                <SortingHat onSorted={handleSorted} />
              </div>
            )}

            {status === GameStatus.Menu && house !== House.Unsorted && !showSpellbook && (
              <div className="ancient-card max-w-md mx-auto p-8 text-center space-y-6 float-animation">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="text-amber-600" size={24} />
                  <h2 className="text-2xl font-display text-ink-brown">
                    Welcome back, {currentUsername}
                  </h2>
                </div>

                <div className="p-6 rounded bg-gradient-to-b from-amber-50 to-amber-100/50 border-2 border-ink-brown/20">
                  <p className="text-sm text-ink-brown/60 uppercase tracking-wider mb-2 font-heading">
                    {graduated ? 'Academy Complete' : 'Current Lesson'}
                  </p>
                  <p className="text-5xl font-display text-ink-brown">{maxLevel}</p>
                  <p className="mt-2 text-sm text-ink-brown/70">
                    Year {currentLesson.year} · {currentLesson.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-4 rounded bg-emerald-50 border border-emerald-800/20">
                    <p className="text-xs uppercase tracking-wide text-emerald-800/60 font-heading">Practiced</p>
                    <p className="text-2xl font-display text-emerald-900">
                      {learningStats.practicedWords}/{learningStats.totalWords}
                    </p>
                    <p className="text-xs text-emerald-900/60">{learningStats.practicedPercent}% discovered</p>
                  </div>
                  <div className="p-4 rounded bg-blue-50 border border-blue-800/20">
                    <p className="text-xs uppercase tracking-wide text-blue-800/60 font-heading">Mastered</p>
                    <p className="text-2xl font-display text-blue-900">
                      {learningStats.masteredWords}/{learningStats.totalWords}
                    </p>
                    <p className="text-xs text-blue-900/60">3 clean completions</p>
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="ancient-btn w-full"
                >
                  <span>{graduated ? 'Practice Final Challenge' : 'Enter Classroom'}</span>
                </button>

                <button
                  onClick={startWeakPractice}
                  disabled={weakPracticeCount === 0}
                  className="ancient-btn w-full"
                  title={weakPracticeCount === 0 ? 'Practice a lesson first to unlock review' : 'Practice words that need more work'}
                >
                  <Wand2 size={18} />
                  <span>{weakPracticeCount === 0 ? 'No Review Words Yet' : `Practice Weak Words (${weakPracticeCount})`}</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setShowSpellbook(true);
                  }}
                  className="ancient-btn ancient-btn-seal w-full"
                >
                  <BookOpen size={18} />
                  <span>Open Spellbook</span>
                </button>
              </div>
            )}

            {status === GameStatus.Playing && (
              <TypingGame
                house={house}
                onEndGame={handleGameEnd}
                initialLevel={gameState ? gameState.level : maxLevel}
                reviewChallenges={reviewChallenges || undefined}
                lessonLabel={reviewChallenges ? 'Review Practice' : undefined}
              />
            )}

            {status === GameStatus.Results && gameState && (
              <div className="ancient-card max-w-lg mx-auto p-10 text-center space-y-6 float-animation">
                <h2 className="text-4xl font-display text-ink-brown mb-4">
                  {gameState.isReview ? 'Practice Complete!' : gameState.isGraduated ? 'Academy Complete!' : 'Class Dismissed!'}
                </h2>

                <p className="text-ink-brown/70">
                  {gameState.isReview
                    ? 'Your review words have been updated in the Spellbook.'
                    : gameState.isGraduated
                    ? 'You completed the final challenge. Keep practicing to master every word.'
                    : `Next lesson unlocked: Year ${getLevelInfo(gameState.level).year} · ${getLevelInfo(gameState.level).title}`}
                </p>

                {completedYear && (
                  <div className="p-6 rounded bg-gradient-to-br from-purple-50 to-amber-100/60 border-2 border-purple-800/20">
                    <p className="text-xs uppercase tracking-wide text-purple-800/60 mb-2 font-heading">Certificate Earned</p>
                    <p className="font-display text-2xl text-purple-900">Year {completedYear.year} Complete</p>
                    <p className="mt-2 text-sm text-purple-900/65">
                      {completedYear.lessonCount} lessons finished with magical precision.
                    </p>
                  </div>
                )}

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
                  <p className="mt-2 text-sm text-amber-900/60">
                    Practiced {learningStats.practicedWords} of {learningStats.totalWords} words · Mastered {learningStats.masteredWords}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setReviewChallenges(null);
                      setStatus(GameStatus.Menu);
                    }}
                    className="ancient-btn flex-1"
                  >
                    Return Home
                  </button>
                  <button
                    onClick={restartGame}
                    className="ancient-btn ancient-btn-seal flex-1"
                  >
                    {gameState.isReview || gameState.isGraduated ? 'Practice Again' : 'Next Level'}
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
