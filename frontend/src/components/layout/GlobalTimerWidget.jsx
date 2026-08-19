import React, { useState, useEffect } from 'react';
import { IoTimeOutline, IoPlay, IoPause } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { getScopedItem } from '../../utils/userStorage';

const GlobalTimerWidget = () => {
    const navigate = useNavigate();
    const [timerData, setTimerData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const updateTimer = () => {
            const stateStr = getScopedItem("focus_timer_state");
            const bindingStr = getScopedItem("focus_timer_task_binding");
            
            if (stateStr) {
                const state = JSON.parse(stateStr);
                const binding = bindingStr ? JSON.parse(bindingStr) : null;
                
                if (state.isActive) {
                    const start = new Date(state.startTime).getTime();
                    const now = Date.now();
                    const duration = state.selectedDuration * 60;
                    const elapsed = Math.floor((now - start) / 1000);
                    const totalSpent = (state.accumulatedTime || 0) + elapsed;
                    const remaining = duration - totalSpent;
                    
                    setTimerData({ ...state, ...binding });
                    setTimeLeft(remaining);
                } else {
                    setTimerData(null);
                }
            } else {
                setTimerData(null);
            }
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, []);

    if (!timerData) return null;

    const minutes = Math.floor(Math.abs(timeLeft) / 60);
    const seconds = Math.abs(timeLeft) % 60;
    const isOvertime = timeLeft < 0;
    const timeStr = `${isOvertime ? '-' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return (
        <div 
            onClick={() => navigate('/focus-timer')}
            className={`mx-4 mb-4 p-3 rounded-xl shadow-lg cursor-pointer transition-all group animate-in slide-in-from-left duration-300 ${isOvertime ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-primary shadow-primary/25 hover:bg-primaryHover'}`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white/80">
                    <IoTimeOutline size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isOvertime ? 'Overtime Active' : 'Focus Active'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-ping ${isOvertime ? 'bg-rose-300' : 'bg-emerald-400'}`}></div>
                </div>
            </div>
            
            <div className="flex items-baseline justify-between gap-2">
                <div className="flex flex-col">
                    <h4 className="text-white font-black text-xl tracking-tighter leading-none">{timeStr}</h4>
                    {timerData.isBacklog && (
                        <span className="text-[8px] font-black bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded mt-1 uppercase tracking-widest border border-rose-500/20">
                            Backlog: {timerData.dueDate ? moment(timerData.dueDate).format("MMM DD") : "Overdue"}
                        </span>
                    )}
                </div>
                <p className="text-white/60 text-[10px] font-bold truncate flex-1 text-right self-start mt-0.5">
                    {timerData.taskName || "Standalone Session"}
                </p>
            </div>

            {!isOvertime && (
                <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-white/40 transition-all duration-1000"
                        style={{ width: `${Math.max(0, (timeLeft / (timerData.selectedDuration * 60)) * 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default GlobalTimerWidget;
