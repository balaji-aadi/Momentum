import React from 'react';

const ProgressBar = ({ progress }) => {
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <span className="text-xs font-medium text-textSub w-8 text-right">{progress}%</span>
        </div>
    );
};

export default ProgressBar;
