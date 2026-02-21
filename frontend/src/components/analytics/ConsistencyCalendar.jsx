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
        : "bg-[#1a1a1a] p-6 rounded-[2.5rem] shadow-2xl text-white overflow-hidden relative group min-h-[400px]";

    return (
        <div className={containerClass}>
            <div className={`flex justify-between items-start mb-6 ${isEmbedded ? 'flex-row-reverse' : ''}`}>
                {!isEmbedded && (
                    <div>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <IoFlashOutline className="text-amber-400" />
                            Consistency
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Activity Tracker</p>
                    </div>
                )}
                <div className={`flex items-center gap-3 ${isEmbedded ? 'w-full justify-between mb-4' : ''}`}>
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <IoChevronBack size={16} />
                    </button>
                    <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                        {currentMonth.format('MMMM YYYY')}
                    </div>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <IoChevronForward size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {weekdays.map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-600 pb-2">{d}</div>
                ))}
                {calendarDays.map((item, idx) => {
                    const hasWork = item.metrics?.hoursLogged > 0 || item.metrics?.tasksCompleted > 0;
                    return (
                        <div 
                            key={idx} 
                            className={`aspect-square flex items-center justify-center rounded-xl relative text-[11px] font-bold group/day cursor-pointer transition-all
                                ${item.padding ? 'opacity-0' : 'hover:scale-110'}
                                ${item.isToday ? 'ring-2 ring-indigo-500' : ''}
                                ${hasWork ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500'}
                                ${!item.padding && !hasWork ? 'hover:bg-white/10' : ''}
                            `}
                        >
                            {!item.padding && (
                                <>
                                    {item.day}
                                    {/* Hover Details */}
                                    {hasWork && (
                                        <div className={`absolute opacity-0 group-hover/day:opacity-100 bottom-full mb-2 w-32 bg-black p-2.5 rounded-xl text-[9px] font-black z-50 pointer-events-none shadow-2xl border border-white/10 transition-all duration-200
                                            ${idx % 7 === 6 ? 'right-0' : idx % 7 === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'}
                                        `}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Focus hours</span>
                                                <span className="text-emerald-400 font-black">{item.metrics.hoursLogged}h</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Tasks Completed</span>
                                                <span className="text-amber-400 font-black">{item.metrics.tasksCompleted}</span>
                                            </div>
                                            <div className={`absolute top-full -mt-1 border-4 border-transparent border-t-black
                                                ${idx % 7 === 6 ? 'right-3' : idx % 7 === 0 ? 'left-3' : 'left-1/2 -translate-x-1/2'}
                                            `}></div>
                                        </div>
                                    )}
                                    {!hasWork && !item.padding && (
                                        <div className={`absolute opacity-0 group-hover/day:opacity-100 bottom-full mb-2 w-24 bg-black p-2 rounded-xl text-[9px] font-black z-50 pointer-events-none shadow-2xl border border-white/10 text-center
                                            ${idx % 7 === 6 ? 'right-0' : idx % 7 === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'}
                                        `}>
                                            <span className="text-slate-500 uppercase tracking-tighter">Day Idle</span>
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

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-emerald-500"></div>
                    <span>Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-white/5"></div>
                    <span>No Work</span>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="grid grid-cols-2 gap-3 pt-6 mt-4">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Streak</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-emerald-500">
                            {calendarDays.filter(d => !d.padding && (d.metrics.hoursLogged > 0)).length} Days
                        </span>
                        <IoCheckmarkCircle className="text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Impact</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-amber-500">
                            {stats.reduce((acc, s) => acc + (Number(s.metrics?.storyPointsDone) || 0), 0)} PTS
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                <span>Momentum Analytics</span>
                <span className="text-slate-400">Reliability v1.1</span>
            </div>
        </div>
    );
};

export default ConsistencyCalendar;
