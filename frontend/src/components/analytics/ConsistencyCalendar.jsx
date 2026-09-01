import React, { useState } from 'react';
import moment from 'moment';
import { IoCheckmarkCircle, IoFlashOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import DayActivityModal from './DayActivityModal';

const ConsistencyCalendar = ({ stats, period = 'monthly', isEmbedded = false, projectId = null, projectName = null }) => {
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDateModal, setSelectedDateModal] = useState(null);

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
        const isFuture = moment(dateStr).isAfter(moment(), 'day');
        const dayStats = stats.find(s => moment(s.date).format('YYYY-MM-DD') === dateStr);
        calendarDays.push({
            day: i,
            date: dateStr,
            metrics: dayStats?.metrics || { hoursLogged: 0, tasksCompleted: 0, storyPointsDone: 0 },
            isToday: moment().format('YYYY-MM-DD') === dateStr,
            isFuture
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
                    const revisions = item.metrics?.revisionsCount || 0;

                    const hasWork = tasks > 0 || hours > 0 || accLogs > 0 || revisions > 0;
                    const isRevisionOnly = hasWork && tasks === 0 && accLogs === 0 && revisions > 0;
                    const isMixed = hasWork && (tasks > 0 || accLogs > 0) && revisions > 0;
                    const isActiveOnly = hasWork && revisions === 0 && (tasks > 0 || hours > 0 || accLogs > 0);

                    let cellStyle = {};
                    let bgClass = 'bg-white/5 text-slate-500'; // Idle

                    if (item.isFuture) {
                        bgClass = 'bg-transparent text-slate-800 opacity-20';
                    } else if (hasWork) {
                        if (isRevisionOnly) {
                            // 100% Revision Only - Signature #E34234
                            cellStyle = {
                                backgroundColor: '#E34234',
                                boxShadow: '0 4px 12px 0 rgba(227, 66, 52, 0.35)',
                                border: '1px solid rgba(227, 66, 52, 0.6)'
                            };
                            bgClass = 'text-white font-black';
                        } else if (isMixed) {
                            // Dynamic proportional split according to ratio of revisions vs tasks
                            const totalCount = revisions + tasks;
                            const revPercent = Math.max(15, Math.min(85, Math.round((revisions / totalCount) * 100)));
                            cellStyle = {
                                background: `linear-gradient(135deg, #E34234 0%, #E34234 ${revPercent}%, #10b981 ${revPercent}%, #10b981 100%)`,
                                boxShadow: '0 4px 12px 0 rgba(227, 66, 52, 0.25), 0 4px 12px 0 rgba(16, 185, 129, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.25)'
                            };
                            bgClass = 'text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]';
                        } else {
                            // 100% Active Work (Green shades based on intensity)
                            if (tasks >= 10 || hours >= 8 || accLogs >= 5) {
                                bgClass = 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/30 border border-emerald-300/40';
                            } else if (tasks >= 5 || hours >= 4 || accLogs >= 3) {
                                bgClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30';
                            } else if (tasks >= 2 || hours >= 2 || accLogs >= 2) {
                                bgClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/20';
                            } else {
                                bgClass = 'bg-emerald-700 text-slate-100 border border-emerald-600/20';
                            }
                        }
                    }

                    return (
                        <div 
                            key={idx} 
                            onClick={() => {
                                if (!item.padding && !item.isFuture) {
                                    setSelectedDateModal(item.date);
                                }
                            }}
                            style={cellStyle}
                            className={`aspect-square flex items-center justify-center rounded-lg relative text-[10px] font-bold group/day transition-all
                                ${item.padding ? 'opacity-0 pointer-events-none' : item.isFuture ? 'cursor-default' : 'hover:scale-105 cursor-pointer active:scale-95'}
                                ${item.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#1a1a1a]' : ''}
                                ${bgClass}
                                ${!item.padding && !hasWork && !item.isFuture ? 'hover:bg-white/10' : ''}
                            `}
                        >
                            {!item.padding && (
                                <>
                                    {item.day}
                                    {/* Hover Details */}
                                    {hasWork && (
                                        <div className={`absolute opacity-0 group-hover/day:opacity-100 bottom-full mb-2 w-36 bg-black/95 p-2.5 rounded-xl text-[8px] font-black z-[100] pointer-events-none shadow-2xl border border-white/10 transition-all duration-200
                                            ${idx % 7 === 6 ? 'right-0' : idx % 7 === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'}
                                        `}>
                                            {isRevisionOnly && (
                                                <div className="text-center py-0.5 text-[#E34234] font-extrabold uppercase tracking-wider text-[7px] border-b border-white/10 mb-1">
                                                    Revision Only
                                                </div>
                                            )}
                                            {isMixed && (
                                                <div className="text-center py-0.5 text-amber-300 font-extrabold uppercase tracking-wider text-[7px] border-b border-white/10 mb-1 flex items-center justify-center gap-1">
                                                    <span>Dual Activity</span>
                                                    <span className="text-slate-400 font-normal">({revisions}R / {tasks}T)</span>
                                                </div>
                                            )}
                                            {isActiveOnly && (
                                                <div className="text-center py-0.5 text-emerald-400 font-extrabold uppercase tracking-wider text-[7px] border-b border-white/10 mb-1">
                                                    Active Work
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Focus</span>
                                                <span className="text-indigo-400 font-black">{hours.toFixed(1)}h</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-slate-400 tracking-tighter uppercase font-bold">Tasks</span>
                                                <span className="text-emerald-400 font-black">{tasks}</span>
                                            </div>
                                            {revisions > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 tracking-tighter uppercase font-bold">Revisions</span>
                                                    <span className="text-[#E34234] font-black">{revisions}</span>
                                                </div>
                                            )}
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
            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] font-bold text-slate-400 whitespace-nowrap">
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                    <span>Active Work</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#E34234] shadow-sm shadow-[#E34234]/50"></div>
                    <span>Revision</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-md bg-gradient-to-br from-[#E34234] to-emerald-500 border border-white/20 shadow-sm"></div>
                    <span>Dual Split</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    <span>Idle</span>
                </div>
            </div>

            {/* Footer Summary - More compact */}
            <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Streak</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-500">
                            {calendarDays.filter(d => !d.padding && (d.metrics.hoursLogged > 0 || d.metrics.tasksCompleted > 0 || d.metrics.accountabilityLogs > 0 || (d.metrics.revisionsCount || 0) > 0)).length}d
                        </span>
                        <IoCheckmarkCircle className="text-emerald-500" size={12} />
                    </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Impact</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-500">
                            {(() => {
                                const totalPoints = stats.reduce((acc, s) => acc + (Number(s.metrics?.storyPointsDone) || 0), 0);
                                if (totalPoints > 0) return totalPoints;
                                // Fallback impact score calculated from tasks completed, revisions, and focus hours
                                return stats.reduce((acc, s) => {
                                    const tasks = Number(s.metrics?.tasksCompleted) || 0;
                                    const hours = Number(s.metrics?.hoursLogged) || 0;
                                    const logs = Number(s.metrics?.accountabilityLogs) || 0;
                                    const revs = Number(s.metrics?.revisionsCount) || 0;
                                    return acc + (tasks * 5) + Math.round(hours * 3) + (logs * 2) + (revs * 3);
                                }, 0);
                            })()}
                        </span>
                        <span className="text-[8px] text-amber-500/80 font-black">PTS</span>
                    </div>
                </div>
            </div>

            {/* Day Details Activity Modal */}
            <DayActivityModal
                isOpen={!!selectedDateModal}
                onClose={() => setSelectedDateModal(null)}
                date={selectedDateModal}
                projectId={projectId}
                projectName={projectName}
            />
        </div>
    );
};

export default ConsistencyCalendar;
