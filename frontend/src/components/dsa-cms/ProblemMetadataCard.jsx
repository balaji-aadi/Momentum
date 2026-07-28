import React from 'react';
import { 
  LuSliders, 
  LuClock, 
  LuTrophy, 
  LuRepeat, 
  LuFlame, 
  LuStar, 
  LuTarget
} from 'react-icons/lu';

export default function ProblemMetadataCard({ formData, setFormData }) {
  const metadata = formData.metadata || {};

  const handleChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        [field]: val
      }
    }));
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <LuSliders size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-textMain dark:text-white">Problem Metadata & Gamification</h2>
          <p className="text-xs text-textSub">XP rewards, solve times, revision weights, and learning objectives.</p>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Estimated Solve Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuClock className="text-primary" />
            <span>Estimated Solve Time (mins)</span>
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={metadata.estimatedSolveTime ?? 20}
            onChange={(e) => handleChange('estimatedSolveTime', Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* XP Reward */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuTrophy className="text-amber-500" />
            <span>XP Reward (Points)</span>
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={metadata.xpReward ?? 50}
            onChange={(e) => handleChange('xpReward', Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Revision Weight */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuRepeat className="text-emerald-500" />
            <span>Revision Weight (1 - 5)</span>
          </label>
          <select
            value={metadata.revisionWeight ?? 1}
            onChange={(e) => handleChange('revisionWeight', Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value={1}>1 - Low Priority</option>
            <option value={2}>2 - Normal</option>
            <option value={3}>3 - Important</option>
            <option value={4}>4 - High Importance</option>
            <option value={5}>5 - Critical Core Pattern</option>
          </select>
        </div>

        {/* Interview Frequency */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuFlame className="text-rose-500" />
            <span>Interview Frequency</span>
          </label>
          <select
            value={metadata.interviewFrequency || 'Medium'}
            onChange={(e) => handleChange('interviewFrequency', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="Low">Low Frequency</option>
            <option value="Medium">Medium Frequency</option>
            <option value="High">High Frequency</option>
            <option value="Very High">Very High (Top Asked)</option>
          </select>
        </div>

        {/* Featured Toggle */}
        <div className="space-y-2 flex flex-col justify-center">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuStar className="text-amber-400" />
            <span>Featured Problem</span>
          </label>
          <button
            type="button"
            onClick={() => handleChange('featuredProblem', !metadata.featuredProblem)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
              metadata.featuredProblem
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-bgLight text-textSub border-borderLight hover:border-slate-300'
            }`}
          >
            <span>{metadata.featuredProblem ? "Featured on Homepage" : "Standard Problem"}</span>
            <span className="text-[10px] uppercase font-extrabold">{metadata.featuredProblem ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Contest Toggle */}
        <div className="space-y-2 flex flex-col justify-center">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuTarget className="text-primary" />
            <span>Contest Problem</span>
          </label>
          <button
            type="button"
            onClick={() => handleChange('contestProblem', !metadata.contestProblem)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
              metadata.contestProblem
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-bgLight text-textSub border-borderLight hover:border-slate-300'
            }`}
          >
            <span>{metadata.contestProblem ? "Contest Problem" : "Practice Problem"}</span>
            <span className="text-[10px] uppercase font-extrabold">{metadata.contestProblem ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Learning Objective */}
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">
            Learning Objective / Key Takeaway
          </label>
          <input
            type="text"
            value={metadata.learningObjective || ''}
            onChange={(e) => handleChange('learningObjective', e.target.value)}
            placeholder="e.g. Master sliding window with fixed and dynamic window sizes."
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white placeholder:text-textSub/50 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
    </div>
  );
}
