import React from 'react';
import DsaCodingArena from './DsaCodingArena';

export function DsaCodingArenaModal({ isOpen, onClose, task, problem, onSolveSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden animate-fade-in">
      <div className="w-full h-full">
        <DsaCodingArena 
          task={task} 
          problem={problem} 
          onClose={onClose} 
          onSolveSuccess={onSolveSuccess} 
        />
      </div>
    </div>
  );
}

export default DsaCodingArenaModal;
