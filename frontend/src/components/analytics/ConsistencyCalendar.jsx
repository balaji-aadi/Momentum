import React, { useState } from 'react';
import moment from 'moment';
import { IoCheckmarkCircle, IoFlashOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';

const ConsistencyCalendar = ({ stats, period = 'monthly', isEmbedded = false }) => {
    const [currentMonth, setCurrentMonth] = useState(moment());

    // Generate days for the selected month
    const startOfMonth = moment(currentMonth).startOf('month');
    const endOfMonth = moment(currentMonth).endOf('month');
    const daysInMonth = startOfMonth.daysInMonth();
    
    // Create an array of days for the grid
    const calendarDays = [];
    const firstDayOfWeek = startOfMonth.day(); // 0 for Sunday, 1 for Monday...

    // Padding for the start of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarDays.push({ padding: true });
    }

    // Fill in the actual days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = moment(currentMonth).date(i).format('YYYY-MM-DD');
        const dayStats = stats.find(s => moment(s.date).format('YYYY-MM-DD') === dateStr);
        calendarDays.push({
            day: i,
            date: dateStr,
            metrics: dayStats?.metrics || { hoursLogged: 0, tasksCompleted: 0, storyPointsDone: 0 },
            isToday: moment().format('YYYY-MM-DD') === dateStr
        });
    }

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const nextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));
    const prevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));

    const containerClass = isEmbedded 
        ? "w-full text-white relative group"
        : "bg-[#1a1a1a] p-4 sm:p-5 rounded-[2rem] shadow-2xl text-white overflow-hidden relative group";

    return (
        <div className={containerClass}>
            <div className={`flex justify-between items-center mb-4 ${isEmbedded ? 'flex-row-reverse' : ''}`}>
                {!isEmbedded && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                            <IoFlashOutline className="text-amber-400" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight leading-none">
                                Consistency
                            </h3>
                            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Performance</p>
                        </div>
                    </div>
                )}
                <div className={`flex items-center gap-2 ${isEmbedded ? 'w-full justify-between' : ''}`}>
                    <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                        <IoChevronBack size={14} />
                    </button>
                    <div className="bg-white/5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                        {currentMonth.format('MMM YYYY')}
                    </div>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                        <IoChevronForward size={14} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {weekdays.map((d, i) => (
                    <div key={`${d}-${i}`} className="text-center text-[8px] font-black text-slate-600 pb-1">{d}</div>
                ))}
                {calendarDays.map((item, idx) => {
                    const tasks = item.metrics?.tasksCompleted || 0;
                    const hours = item.metrics?.hoursLogged || 0;
                    const accLogs = item.metrics?.accountabilityLogs || 0;
                    const hasWork = tasks > 0 || hours > 0 || accLogs > 0;
                    
                    // Intensity scale for Github-style heatmap:
                    let bgClass = 'bg-white/5 text-slate-500'; // Idle
                    if (hasWork) {
                        if (tasks >= 10 || hours >= 8 || accLogs >= 5) bgClass = 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/30'; // High
                        else if (tasks >= 5 || hours >= 4 || accLogs >= 3) bgClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'; // Mid
                        else if (tasks >= 2 || hours >= 2 || accLogs >= 2) bgClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'; // Low-Mid
                        else bgClass = 'bg-emerald-800 text-slate-200'; // Dip (1 log)
                    }

                    return (
                        <div 
                            key={idx} 
                            className={`aspect-square flex items-center justify-center rounded-lg relative text-[10px] font-bold group/day cursor-pointer transition-all
                                ${item.padding ? 'opacity-0 pointer-events-none' : 'hover:scale-105'}
                                ${item.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#1a1a1a]' : ''}
                                ${bgClass}
                                ${!item.padding && !hasWork ? 'hover:bg-white/10' : ''}
                            `}
                        >
                            {!item.padding && (
                                <>
                                    {item.day}
                                    {/* Hover Details */}
                                    {hasWork && (
                                        <div className={`absolute opacity-0 group-hover/day:opacity-100 bottom-full mb-2 w-28 bg-black p-2 rounded-lg text-[8px] font-black z-[100] pointer-events-none shadow-2xl border border-white/10 transition-all duration-200
                                            ${idx % 7 === 6 ? 'right-0' : idx % 7 === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'}
                                        `}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Focus</span>
                                                <span className="text-emerald-400 font-black">{item.metrics.hoursLogged}h</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Tasks</span>
                                                <span className="text-amber-400 font-black">{item.metrics.tasksCompleted}</span>
                                            </div>
                                            <div className={`absolute top-full -mt-1 border-4 border-transparent border-t-black
                                                ${idx % 7 === 6 ? 'right-3' : idx % 7 === 0 ? 'left-3' : 'left-1/2 -translate-x-1/2'}
                                            `}></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Compact Legend */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3 text-[8px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    <span>Idle</span>
                </div>
            </div>

            {/* Footer Summary - More compact */}
            <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Streak</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-500">
                            {calendarDays.filter(d => !d.padding && (d.metrics.hoursLogged > 0)).length}d
                        </span>
                        <IoCheckmarkCircle className="text-emerald-500" size={12} />
                    </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Impact</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-500">
                            {stats.reduce((acc, s) => acc + (Number(s.metrics?.storyPointsDone) || 0), 0)}
                        </span>
                        <span className="text-[8px] text-amber-500/80 font-black">PTS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsistencyCalendar;
