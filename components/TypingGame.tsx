import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, House, WordChallenge } from '../types';
import { generateChallenges, getSnapeVoice, TOTAL_LEVELS } from '../services/gameContentService';
import * as storageService from '../services/storageService';
import { soundEffects } from '../services/soundEffects';
import VirtualKeyboard from './VirtualKeyboard';
import { BookOpen, Sparkles, Star, Trophy, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TypingGameProps {
  house: House;
  onEndGame: (finalState: GameState) => void;
  initialLevel: number;
  reviewChallenges?: WordChallenge[];
  lessonLabel?: string;
}

const TypingGame: React.FC<TypingGameProps> = ({ house, onEndGame, initialLevel, reviewChallenges, lessonLabel }) => {
  const [challenges, setChallenges] = useState<WordChallenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [shake, setShake] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    house,
    level: initialLevel,
    score: 0,
    wpm: 0,
    accuracy: 100,
    streak: 0
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const errorsRef = useRef<number>(0);
  const wordErrorsRef = useRef<number>(0);
  const correctCharsRef = useRef<number>(0);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const loadLevel = useCallback(async () => {
    setLoading(true);
    const words = reviewChallenges && reviewChallenges.length > 0
      ? reviewChallenges.slice().sort(() => Math.random() - 0.5)
      : await generateChallenges(gameState.level);
    setChallenges(words);
    setLoading(false);
    setUserInput('');
    setCurrentChallengeIndex(0);
    startTimeRef.current = null;
    errorsRef.current = 0;
    wordErrorsRef.current = 0;
    correctCharsRef.current = 0;
    
    // Auto focus
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [gameState.level, reviewChallenges]);

  useEffect(() => {
    loadLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const playSnapeHint = async (text: string) => {
     // Stop previous
     if (voiceSourceRef.current) {
         voiceSourceRef.current.stop();
         voiceSourceRef.current = null;
     }

     setIsPlayingVoice(true);
     
     try {
        const audioBuffer = await getSnapeVoice(text);
        if (audioBuffer) {
             const ctx = soundEffects.getContext();
             if (!ctx) return;
             
             const source = ctx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(ctx.destination);
             source.onended = () => setIsPlayingVoice(false);
             voiceSourceRef.current = source;
             source.start();
        } else {
            // Fallback
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 0.6; // Deep pitch
            utterance.onend = () => setIsPlayingVoice(false);
            window.speechSynthesis.speak(utterance);
        }
     } catch (e) {
         console.error(e);
         setIsPlayingVoice(false);
     }
  };

  useEffect(() => {
    if (!loading && challenges.length > 0) {
      const current = challenges[currentChallengeIndex];
      // Play Snape's voice for the hint
      playSnapeHint(current.hint);
    }
  }, [currentChallengeIndex, loading, challenges]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const val = e.target.value.toLowerCase().replace(/[^a-z ]/g, '');
    const currentWord = challenges[currentChallengeIndex]?.word;

    if (!currentWord) return;

    // Check strict prefix
    if (currentWord.startsWith(val)) {
        setUserInput(val);
        
        // Stats
        if (val.length > userInput.length) {
            correctCharsRef.current += 1;
        }

        // Check completion
        if (val === currentWord) {
           handleWordComplete();
        }
    } else {
        // Wrong character typed
        errorsRef.current += 1;
        wordErrorsRef.current += 1;
        setGameState(prev => ({ ...prev, streak: 0 }));
        soundEffects.playError();
        
        // Trigger shake animation
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }
  };

  const handleWordComplete = () => {
    const completedWord = challenges[currentChallengeIndex];
    const newStreak = gameState.streak + 1;
    
    // Play sound based on streak
    if (newStreak > 1 && newStreak % 5 === 0) {
        soundEffects.playStreakBonus();
        // Mini confetti for streak
        confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#FFD700', '#FFA500']
        });
    } else {
        soundEffects.playWordComplete();
    }
    
    const newScore = gameState.score + 10 + (gameState.streak * 2);
    storageService.recordWordPractice(completedWord.id, completedWord.word, wordErrorsRef.current);
    wordErrorsRef.current = 0;
    
    setGameState(prev => ({
        ...prev,
        score: newScore,
        streak: newStreak
    }));

    if (currentChallengeIndex + 1 < challenges.length) {
        setCurrentChallengeIndex(prev => prev + 1);
        setUserInput('');
    } else {
        handleLevelComplete(newScore, newStreak);
    }
  };

  const handleLevelComplete = (score: number, streak: number) => {
    soundEffects.playLevelWin();
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    const durationMin = (Date.now() - (startTimeRef.current || Date.now())) / 60000;
    const time = durationMin > 0 ? durationMin : 1;
    
    const wpm = Math.round((correctCharsRef.current / 5) / time);
    const totalKeystrokes = correctCharsRef.current + errorsRef.current;
    const accuracy = totalKeystrokes > 0 ? Math.round((correctCharsRef.current / totalKeystrokes) * 100) : 100;
    const isReview = !!reviewChallenges?.length;
    const isGraduated = !isReview && gameState.level >= TOTAL_LEVELS;

    const finalState = {
        ...gameState,
        completedLevel: gameState.level,
        isReview,
        level: isReview ? gameState.level : isGraduated ? TOTAL_LEVELS : gameState.level + 1,
        score,
        streak,
        wpm,
        accuracy,
        isGraduated
    };

    // Delay calling onEndGame slightly so the user hears the sound/sees confetti
    setTimeout(() => {
        onEndGame(finalState);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="relative">
          <Sparkles className="w-20 h-20 text-yellow-400 animate-spin" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }} />
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-yellow-400/20 blur-xl animate-pulse"></div>
        </div>
        <p className="font-magic text-3xl shimmer-text animate-pulse" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Summoning Words...
        </p>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  const currentChallenge = challenges[currentChallengeIndex];
  const nextChar = currentChallenge.word.slice(userInput.length, userInput.length + 1);
  const progressPercent = Math.round(((currentChallengeIndex + 1) / challenges.length) * 100);
  const houseName = house === House.Unsorted ? 'New Student' : house;

  return (
    <div className="lesson-shell magic-cursor">
      {/* Floating magical particles */}
      <div className="particle-field">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header / Stats */}
      <div className="lesson-topbar">
        <div className="lesson-level">
          <BookOpen size={22} />
          <div>
            <span>{lessonLabel || 'Lesson Level'}</span>
            <strong>{gameState.level}</strong>
          </div>
        </div>
        <div className="lesson-stats">
          <div className="lesson-stat">
            <Trophy size={18} />
            <span>Score</span>
            <strong>{gameState.score}</strong>
          </div>
          <div className="lesson-stat">
            <Star size={18} />
            <span>Streak</span>
            <strong className={gameState.streak > 4 ? 'streak-glow' : ''}>x{gameState.streak}</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="lesson-progress">
        <div className="wand-progress-container">
          <div
            className="wand-progress-fill"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="wand-tip"></div>
          </div>
        </div>
        <div className="progress-caption">
          <span>Word {currentChallengeIndex + 1} of {challenges.length}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className={`lesson-board ${shake ? 'error-shake error-flash' : ''}`}
           style={{
             borderColor: house === House.Gryffindor ? 'var(--gryffindor-gold)' :
                         house === House.Slytherin ? 'var(--slytherin-silver)' :
                         house === House.Ravenclaw ? 'var(--ravenclaw-bronze)' :
                         house === House.Hufflepuff ? 'var(--hufflepuff-primary)' : 'var(--gold-shimmer)'
           }}>

        {/* Smoke particles on error */}
        {shake && (
          <div className="smoke-wrap">
            <div className="smoke-particle"></div>
            <div className="smoke-particle"></div>
            <div className="smoke-particle"></div>
          </div>
        )}

        <section className="word-stage">
          <div className="hint-row">
            <Sparkles size={20} />
            <p className={isPlayingVoice ? 'shimmer-text' : ''}>{currentChallenge.hint}</p>
            {isPlayingVoice && <Volume2 size={20} className="voice-icon" />}
          </div>

          <div className="word-card" aria-label={`Type ${currentChallenge.word}`}>
            {currentChallenge.word.split('').map((char, idx) => {
              let classes = 'letter-pending';
              if (idx < userInput.length) {
                classes = 'letter-correct';
              }
              if (idx === userInput.length) {
                classes = 'letter-active';
              }

              return (
                <span key={idx} className={classes}>
                  {char}
                  {idx === userInput.length - 1 && idx < userInput.length && (
                    <span className="sparkle-burst">
                      <span className="sparkle"></span>
                      <span className="sparkle"></span>
                      <span className="sparkle"></span>
                      <span className="sparkle"></span>
                      <span className="sparkle"></span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <div className="helper-strip">
            <span>Next key</span>
            <strong>{nextChar === ' ' ? 'Space' : nextChar.toUpperCase()}</strong>
          </div>
        </section>

        <aside className="coach-panel">
          <div className="coach-orb">✨</div>
          <p className="coach-title">{houseName} practice</p>
          <p>Keep your eyes on the big word. Your next glowing key is waiting below.</p>
        </aside>

            {/* Hidden Input to capture keystrokes */}
            <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    // SAFARI FIX: Synchronously initialize/get context within user gesture
                    // This is required for Safari/iOS Web Audio to work
                    soundEffects.getContext();

                    // Resume context on every key
                    soundEffects.resume();

                    // If it's a printable character, play a generic click immediately
                    if (e.key.length === 1) {
                        soundEffects.playKeyClick();
                    }
                }}
                onBlur={() => inputRef.current?.focus()}
                className="opacity-0 absolute top-0 left-0 w-0 h-0"
                autoFocus
            />

        <div className="keyboard-zone">
            <VirtualKeyboard activeKey={nextChar} />
        </div>
      </div>

      <p className="lesson-footer">
        Type the glowing key, then watch your spell grow stronger.
      </p>
    </div>
  );
};

export default TypingGame;
