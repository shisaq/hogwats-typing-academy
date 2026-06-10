import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, House, WordChallenge, GameStatus } from '../types';
import { generateChallenges, getSnapeVoice } from '../services/gameContentService';
import { soundEffects } from '../services/soundEffects';
import VirtualKeyboard from './VirtualKeyboard';
import { RotateCcw, Award, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TypingGameProps {
  house: House;
  onEndGame: (finalState: GameState) => void;
  initialLevel: number;
}

const TypingGame: React.FC<TypingGameProps> = ({ house, onEndGame, initialLevel }) => {
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
  const correctCharsRef = useRef<number>(0);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // House color theming
  const getHouseColor = (h: House) => {
    switch(h) {
      case House.Gryffindor: return 'bg-red-800 border-red-950 text-yellow-500';
      case House.Slytherin: return 'bg-green-800 border-green-950 text-gray-200';
      case House.Ravenclaw: return 'bg-blue-900 border-blue-950 text-gray-200';
      case House.Hufflepuff: return 'bg-yellow-600 border-yellow-800 text-black';
      default: return 'bg-gray-700 border-gray-900 text-white';
    }
  };

  const loadLevel = useCallback(async () => {
    setLoading(true);
    const words = await generateChallenges(gameState.level);
    setChallenges(words);
    setLoading(false);
    setUserInput('');
    setCurrentChallengeIndex(0);
    startTimeRef.current = null;
    
    // Auto focus
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [gameState.level]);

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
        setGameState(prev => ({ ...prev, streak: 0 }));
        soundEffects.playError();
        
        // Trigger shake animation
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }
  };

  const handleWordComplete = () => {
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
    
    setGameState(prev => ({
        ...prev,
        score: newScore,
        streak: newStreak
    }));

    if (currentChallengeIndex + 1 < challenges.length) {
        setCurrentChallengeIndex(prev => prev + 1);
        setUserInput('');
    } else {
        handleLevelComplete();
    }
  };

  const handleLevelComplete = () => {
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

    const finalState = {
        ...gameState,
        level: gameState.level + 1,
        wpm,
        accuracy
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

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 magic-cursor">
      {/* Floating magical particles */}
      <div className="particle-field">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header / Stats */}
      <div className="flex justify-between w-full mb-8 parchment-container p-4 text-black font-magic">
        <div className="flex items-center gap-2 z-10">
            <span className="shimmer-text text-xl font-bold">Level {gameState.level}</span>
        </div>
        <div className="flex items-center gap-4 z-10">
            <div className="flex flex-col items-center">
                <span className="text-xs text-gray-600 uppercase tracking-wide">Score</span>
                <span className="text-xl font-bold text-gray-800">{gameState.score}</span>
            </div>
            <div className="flex flex-col items-center transition-all duration-300">
                <span className="text-xs text-gray-600 uppercase tracking-wide">Streak</span>
                <span className={`${gameState.streak > 4 ? 'streak-glow' : ''} transition-transform duration-300 text-xl font-bold`}
                      style={{ color: gameState.streak > 4 ? 'var(--gold-bright)' : 'inherit' }}>
                    ×{gameState.streak}
                </span>
            </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-6">
        <div className="wand-progress-container">
          <div
            className="wand-progress-fill"
            style={{ width: `${((currentChallengeIndex + 1) / challenges.length) * 100}%` }}
          >
            <div className="wand-tip"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/60 font-sans">
          <span>Word {currentChallengeIndex + 1} of {challenges.length}</span>
          <span>{Math.round(((currentChallengeIndex + 1) / challenges.length) * 100)}%</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className={`parchment-container relative w-full p-8 md:p-12 transition-all duration-500 ${shake ? 'error-shake error-flash' : ''}`}
           style={{
             borderColor: house === House.Gryffindor ? 'var(--gryffindor-gold)' :
                         house === House.Slytherin ? 'var(--slytherin-silver)' :
                         house === House.Ravenclaw ? 'var(--ravenclaw-bronze)' :
                         house === House.Hufflepuff ? 'var(--hufflepuff-primary)' : 'var(--gold-shimmer)'
           }}>

        {/* Smoke particles on error */}
        {shake && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="smoke-particle"></div>
            <div className="smoke-particle"></div>
            <div className="smoke-particle"></div>
          </div>
        )}

        {/* Placeholder Image with magical border */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full overflow-hidden border-4 hidden md:block z-10"
             style={{
               borderColor: house === House.Gryffindor ? 'var(--gryffindor-gold)' :
                           house === House.Slytherin ? 'var(--emerald-glow)' :
                           house === House.Ravenclaw ? 'var(--spell-blue)' :
                           'var(--gold-shimmer)',
               boxShadow: `0 0 20px ${house === House.Gryffindor ? 'var(--gryffindor-gold)' :
                                      house === House.Slytherin ? 'var(--emerald-glow)' :
                                      house === House.Ravenclaw ? 'var(--spell-blue)' :
                                      'var(--gold-shimmer)'}`
             }}>
            <img
                src={`https://picsum.photos/seed/${currentChallenge.word}/100/100`}
                alt="Magic Item"
                className="w-full h-full object-cover"
            />
        </div>

        <div className="flex flex-col items-center space-y-6 z-10 relative">
            <div className="text-center relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <p className={`text-xl font-magic tracking-wider transition-all duration-300 ${isPlayingVoice ? 'shimmer-text' : 'text-gray-700'}`}
                       style={{ fontFamily: "'IM Fell English', serif" }}>
                        {currentChallenge.hint}
                    </p>
                    {isPlayingVoice && <Volume2 size={20} className="text-yellow-500 animate-pulse" />}
                </div>

                <div className="flex text-5xl md:text-7xl font-bold tracking-widest bg-gradient-to-b from-black/5 to-black/10 px-8 py-6 rounded-xl border-2 border-gray-300/50 relative"
                     style={{ fontFamily: "'MedievalSharp', cursive" }}>
                    {currentChallenge.word.split('').map((char, idx) => {
                        let classes = 'text-gray-400/40 transition-all duration-200'; // Not typed yet
                        if (idx < userInput.length) {
                          classes = 'letter-correct text-emerald-600'; // Correctly typed
                        }
                        if (idx === userInput.length) {
                          classes = 'letter-active text-amber-600'; // Current cursor
                        }

                        return (
                            <span key={idx} className={classes} style={{ position: 'relative' }}>
                                {char}
                                {/* Sparkle burst on completed letter */}
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
            </div>

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

            <VirtualKeyboard activeKey={nextChar} />
        </div>
      </div>

      <p className="mt-8 text-white/60 text-sm font-sans italic">
        ✨ Keep your eyes on the parchment! True magic flows through focused fingers.
      </p>
    </div>
  );
};

export default TypingGame;
