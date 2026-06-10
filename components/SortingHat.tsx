import React, { useState } from 'react';
import { sortUserIntoHouse, SortingResult } from '../services/gameContentService';
import { House } from '../types';
import { Sparkles, Wand2, Check, Loader2 } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface SortingHatProps {
  onSorted: (house: House) => void;
}

const SortingHat: React.FC<SortingHatProps> = ({ onSorted }) => {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<SortingResult | null>(null);

  const handleSort = async () => {
    if (!input.trim()) return;
    soundEffects.playButtonClick();
    setThinking(true);
    const sortingResult = await sortUserIntoHouse(input);
    setThinking(false);
    setResult(sortingResult);
    soundEffects.playHouseReveal(sortingResult.house.toLowerCase() as 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff');
  };

  const handleConfirm = () => {
    soundEffects.playButtonClick();
    if (result) {
      onSorted(result.house);
    }
  };

  const getHouseColor = (house: House) => {
    switch(house) {
      case House.Gryffindor: return { bg: 'from-red-900/40 to-red-800/40', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-red-500/20' };
      case House.Slytherin: return { bg: 'from-emerald-900/40 to-emerald-800/40', border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
      case House.Ravenclaw: return { bg: 'from-blue-900/40 to-blue-800/40', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' };
      case House.Hufflepuff: return { bg: 'from-amber-900/40 to-amber-800/40', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-amber-500/20' };
      default: return { bg: 'from-gray-900/40 to-gray-800/40', border: 'border-gray-500/50', text: 'text-gray-400', glow: '' };
    }
  };

  const getHouseEmoji = (house: House) => {
    switch(house) {
      case House.Gryffindor: return '🦁';
      case House.Slytherin: return '🐍';
      case House.Ravenclaw: return '🦅';
      case House.Hufflepuff: return '🦡';
      default: return '❓';
    }
  };

  return (
    <div className="mystical-card max-w-xl mx-auto p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-magic shimmer-text mb-2">The Sorting Hat</h2>
        <p className="text-sm text-gray-400 font-serif italic">"Where shall I put you?"</p>
      </div>

      {/* Hat Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-amber-900/80 to-purple-900/80 border border-amber-500/30 flex items-center justify-center text-4xl shadow-2xl">
            🎩
          </div>
        </div>
      </div>

      {!result ? (
        <>
          <p className="text-center text-gray-300 font-serif text-sm leading-relaxed">
            "Tell me, young wizard, what do you value most? Or what is your favorite magical creature?"
          </p>

          {thinking ? (
            <div className="h-24 flex items-center justify-center space-x-3">
              <Loader2 className="animate-spin text-purple-400" size={24} />
              <span className="text-sm font-magic text-purple-300 animate-pulse">
                Hmm... difficult. Very difficult...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSort()}
                placeholder="e.g., Bravery, Owls, Helping others..."
                className="mystical-input"
              />
              <button
                onClick={handleSort}
                disabled={!input.trim()}
                className="mystical-btn w-full"
              >
                <Wand2 size={18} />
                <span>Sort Me!</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`p-6 rounded-xl border bg-gradient-to-b ${getHouseColor(result.house).bg} ${getHouseColor(result.house).border} ${getHouseColor(result.house).glow} shadow-xl`}>
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">{getHouseEmoji(result.house)}</div>
            <h3 className={`text-3xl font-magic mb-2 ${getHouseColor(result.house).text}`}>
              {result.house}!
            </h3>
            <p className="text-gray-300 text-sm mb-4">{result.reason}</p>

            {result.matchedKeywords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Matched Traits:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {result.matchedKeywords.map((keyword) => (
                    <span key={keyword} className="px-3 py-1 rounded-full text-xs bg-black/30 text-gray-300 border border-white/10">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setInput('');
                }}
                className="mystical-btn flex-1"
                style={{ background: 'rgba(60, 60, 70, 0.5)' }}
              >
                Try Again
              </button>
              <button
                onClick={handleConfirm}
                className="mystical-btn mystical-btn-primary flex-1"
              >
                <Check size={18} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortingHat;
