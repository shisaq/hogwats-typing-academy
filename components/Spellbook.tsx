import React, { useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Sparkles, Wand2 } from 'lucide-react';
import { WordPracticeStats } from '../types';
import { getCurriculumLessons, getCurriculumStats } from '../services/gameContentService';

interface SpellbookProps {
  wordStats: Record<string, WordPracticeStats>;
  onBack: () => void;
}

const masteryStyles = {
  new: 'bg-stone-100 text-stone-700 border-stone-300',
  seen: 'bg-amber-100 text-amber-800 border-amber-300',
  learning: 'bg-blue-100 text-blue-800 border-blue-300',
  mastered: 'bg-emerald-100 text-emerald-800 border-emerald-300'
};

const getMasteryLabel = (stats?: WordPracticeStats) => {
  if (!stats) return 'New';
  if (stats.mastery === 'mastered') return 'Mastered';
  if (stats.mastery === 'learning') return 'Learning';
  return 'Seen';
};

const Spellbook: React.FC<SpellbookProps> = ({ wordStats, onBack }) => {
  const lessons = useMemo(() => getCurriculumLessons(), []);
  const stats = useMemo(() => getCurriculumStats(wordStats), [wordStats]);

  return (
    <div className="ancient-card w-full max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-amber-700" size={28} />
          <div>
            <h2 className="text-3xl font-display text-ink-brown">Spellbook</h2>
            <p className="text-sm text-ink-brown/65">
              {stats.practicedWords} practiced · {stats.masteredWords} mastered · {stats.totalWords} total
            </p>
          </div>
        </div>
        <button onClick={onBack} className="ancient-btn">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="p-4 rounded bg-emerald-50 border border-emerald-800/20">
          <p className="text-xs uppercase tracking-wide text-emerald-800/60 font-heading">Practiced</p>
          <p className="text-3xl font-display text-emerald-900">{stats.practicedPercent}%</p>
        </div>
        <div className="p-4 rounded bg-blue-50 border border-blue-800/20">
          <p className="text-xs uppercase tracking-wide text-blue-800/60 font-heading">Mastered</p>
          <p className="text-3xl font-display text-blue-900">{stats.masteredPercent}%</p>
        </div>
        <div className="p-4 rounded bg-amber-50 border border-amber-800/20">
          <p className="text-xs uppercase tracking-wide text-amber-800/60 font-heading">Weak Words</p>
          <p className="text-3xl font-display text-amber-900">
            {Object.values(wordStats).filter((item) => item.errorCount > 0 && item.mastery !== 'mastered').length}
          </p>
        </div>
      </div>

      <div className="space-y-5 max-h-[62vh] overflow-y-auto pr-1">
        {lessons.map((lesson) => {
          const completedWords = lesson.words.filter((word) => wordStats[word.id]?.completedCount > 0).length;

          return (
            <section key={lesson.level} className="rounded border border-ink-brown/20 bg-amber-50/60 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-brown/55 font-heading">
                    Year {lesson.year} · Lesson {lesson.level}
                  </p>
                  <h3 className="text-xl font-display text-ink-brown">{lesson.title}</h3>
                </div>
                <p className="text-sm text-ink-brown/65">
                  {completedWords}/{lesson.words.length} practiced
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {lesson.words.map((entry) => {
                  const practice = wordStats[entry.id];
                  const mastery = practice?.mastery || 'new';

                  return (
                    <article key={entry.id} className="rounded border border-ink-brown/15 bg-white/70 p-3 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-lg text-ink-brown">{entry.word}</p>
                          <p className="text-xs text-ink-brown/55 capitalize">{entry.category} · Difficulty {entry.difficulty}</p>
                        </div>
                        {mastery === 'mastered' ? (
                          <CheckCircle2 className="text-emerald-700 shrink-0" size={18} />
                        ) : practice ? (
                          <Sparkles className="text-amber-700 shrink-0" size={18} />
                        ) : (
                          <Circle className="text-stone-500 shrink-0" size={18} />
                        )}
                      </div>

                      <p className="mt-2 min-h-10 text-sm text-ink-brown/70">{entry.hint}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-1 text-xs font-heading ${masteryStyles[mastery]}`}>
                          {getMasteryLabel(practice)}
                        </span>
                        {practice && (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-brown/60">
                            <Wand2 size={13} />
                            {practice.completedCount}x · {practice.errorCount} errors · {practice.bestAccuracy}%
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Spellbook;
