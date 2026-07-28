import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCodingArena } from './CodingArenaContext';
import {
  LuArrowLeft,
  LuPlay,
  LuSend,
  LuTrophy
} from 'react-icons/lu';

export function DsaArenaHeader({ onBack, onClose }) {
  const navigate = useNavigate();
  const {
    problem,
    handleRunCode,
    handleSubmitCode,
    isRunning,
    isSubmitting,
    isSolved,
    userXp
  } = useCodingArena();

  const handleExit = () => {
    if (onBack) return onBack();
    if (onClose) return onClose();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dsa-management/problems');
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-[#2cbb5d]/10 text-[#2cbb5d] border-[#2cbb5d]/20';
      case 'medium': return 'bg-[#ffc01e]/10 text-[#ffc01e] border-[#ffc01e]/20';
      case 'hard': return 'bg-[#ef4743]/10 text-[#ef4743] border-[#ef4743]/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="h-12 border-b border-[#2d2d2d] bg-[#1a1a1a] px-4 flex items-center justify-between shrink-0 select-none z-20 !mb-0 !pb-0 !m-0 font-sans">
      {/* Left Section: Exit Arena & Problem Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-[#262626] border border-slate-700/60 transition-all cursor-pointer"
          title="Exit Coding Arena"
        >
          <LuArrowLeft size={14} />
          <span>Exit Arena</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700/60 mx-1 hidden sm:block" />

        {/* Problem Title, Difficulty & Solved Badge */}
        <div className="flex items-center gap-2.5 max-w-[280px] sm:max-w-[480px] truncate">
          <span className="text-sm font-bold text-white tracking-tight truncate">
            {problem?.title || 'Problem Arena'}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getDifficultyBadge(problem?.difficulty)} shrink-0`}>
            {problem?.difficulty || 'Easy'}
          </span>
          {isSolved && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              Solved ✓
            </span>
          )}
        </div>
      </div>

      {/* Right Section: Problem XP Reward & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Problem XP Reward Badge */}
        <div className="hidden sm:flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 shadow-xs" title="Problem XP Reward">
          <LuTrophy size={13} />
          <span>{problem?.metadata?.xpReward ?? problem?.xpReward ?? 50} XP</span>
        </div>

        {/* Action Buttons: Run Code & Submit */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#262626] hover:bg-[#333333] text-slate-100 rounded-md font-bold text-xs border border-slate-700/80 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LuPlay size={13} className="text-emerald-400 fill-emerald-400" />
            )}
            <span>Run</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-xs shadow transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LuSend size={13} />
            )}
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
