import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import moment from 'moment';
import { IoCalendarOutline } from 'react-icons/io5';

const TimelineBoard = ({ tasks = [], isLoading, onTaskClick }) => {
    
    // 1. Determine date range
    const { startDate, endDate, days } = useMemo(() => {
        if (!tasks.length) return { startDate: moment(), endDate: moment().add(30, 'days'), days: [] };

        const dates = tasks.flatMap(t => [
            t.taskStartDate ? moment(t.taskStartDate) : moment(t.createdAt),
            t.taskDueDate ? moment(t.taskDueDate) : moment().add(1, 'day')
        ]);
        
        const min = moment.min(dates).subtract(2, 'days');
        const max = moment.max(dates).add(5, 'days');
        
        const dayList = [];
        let current = min.clone();
        while (current.isBefore(max)) {
            dayList.push(current.clone());
            current.add(1, 'day');
        }

        return { startDate: min, endDate: max, days: dayList };
    }, [tasks]);

    const getTaskColor = (task) => {
        switch (task.status) {
            case 'done': return 'bg-emerald-600 hover:bg-emerald-700';
            case 'inprogress': return 'bg-amber-600 hover:bg-amber-700';
            case 'hold': return 'bg-orange-600 hover:bg-orange-700';
            case 'todo': return 'bg-slate-500 hover:bg-slate-600';
            default: return 'bg-primary hover:bg-primaryHover';
        }
    };

    const dayCellRef = useRef(null);
    const [perDay, setPerDay] = useState(60);

    useLayoutEffect(() => {
      if (dayCellRef.current) {
        const w = dayCellRef.current.offsetWidth;
        if (w && w !== perDay) {
          setPerDay(w);
        }
      }
    }, [days, perDay]);

    const getTaskStyle = (task) => {
        const start = task.taskStartDate ? moment(task.taskStartDate) : moment(task.createdAt);
        const end = task.taskDueDate ? moment(task.taskDueDate) : moment().add(1, 'day');

        const idx = days.findIndex(d => d.isSame(start, 'day'));
        const idxEnd = days.findIndex(d => d.isSame(end, 'day'));
        const left = idx >= 0 ? idx * perDay : 0;
        const dur = (idxEnd >= idx ? idxEnd - idx + 1 : 1);

        return {
            left: `${left}px`,
            width: `${dur * perDay}px`,
            minWidth: '40px'
        };
    };

    if (isLoading) return <div className="p-8 text-center text-textSub italic animate-pulse">Gathering timeline data...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/20 rounded-2xl shadow-inner border border-borderLight overflow-hidden">
            <div className={`flex-1 overflow-auto relative custom-scrollbar ${tasks.length === 0 ? 'bg-white dark:bg-slate-900' : ''}`}>
                <div style={{ width: `${(days.length * perDay) + 288}px` }}>
                     {/* Header: Months/Days */}
                     <div className="flex border-b border-borderLight sticky top-0 bg-white dark:bg-slate-900 z-30 shadow-sm">
                         <div className="w-72 flex-shrink-0 p-4 font-bold text-xs uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-r border-borderLight">Task Name</div>
                         <div className="flex" style={{ width: `${days.length * perDay}px` }}>
                             {days.map((day, i) => {
                                 const isToday = day.isSame(moment(), 'day');
                                 const isWeekend = day.day() === 0 || day.day() === 6;
                                 return (
                                     <div
                                       key={i}
                                       ref={i === 0 ? dayCellRef : null}
                                       className={`flex-shrink-0 border-r border-borderLight/50 text-center py-2.5 transition-colors ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/20' : ''}`}
                                       style={{ width: `${perDay}px` }}>
                                        <div className={`text-[11px] font-black ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{day.format('DD')}</div>
                                        <div className={`text-[9px] font-bold uppercase ${isToday ? 'text-primary' : 'text-slate-400'}`}>{day.format('ddd')}</div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>

                     {/* Body: Tasks */}
                     <div className="divide-y divide-borderLight/50 bg-white dark:bg-slate-900/40">
                         {tasks.length > 0 ? tasks.map(task => (
                             <div key={task._id} className="flex hover:bg-primary/[0.02] relative group min-h-[48px]">
                                 <div className="w-72 flex-shrink-0 p-3 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate border-r border-borderLight bg-white dark:bg-slate-900 sticky left-0 z-20 flex items-center gap-2">
                                     <div className={`w-1.5 h-6 rounded-full shrink-0 ${
                                         task.taskPriority === 'high' ? 'bg-red-500' : 
                                         task.taskPriority === 'medium' ? 'bg-orange-500' : 
                                         'bg-blue-500'
                                     }`}></div>
                                     <div className="truncate flex flex-col">
                                         <span className="truncate">{task.taskName}</span>
                                         <span className="text-[10px] text-slate-400 font-medium">#{task._id.slice(-4)}</span>
                                     </div>
                                 </div>
                                 <div className="flex-1 relative py-3">
                                     {/* Background Grid Lines */}
                                     <div className="absolute inset-0 flex pointer-events-none">
                                         {days.map((day, i) => (
                                             <div 
                                                key={i} 
                                                className={`flex-shrink-0 border-r border-borderLight/30 ${day.isSame(moment(), 'day') ? 'bg-primary/[0.03]' : ''}`}
                                                style={{ width: `${perDay}px` }}
                                             ></div>
                                         ))}
                                     </div>

                                     {/* Task Bar */}
                                     <div 
                                        className={`relative h-9 ${getTaskColor(task)} rounded-lg shadow-md border border-black/10 cursor-pointer transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] z-10 flex items-center overflow-hidden`}
                                        style={getTaskStyle(task)}
                                        title={`${task.taskName}\nStatus: ${task.status}\nPriority: ${task.taskPriority}\nRange: ${moment(task.taskStartDate || task.createdAt).format('MMM D')} - ${moment(task.taskDueDate).format('MMM D')}`}
                                        onClick={() => onTaskClick?.(task)}
                                     >
                                         <div className="flex items-center gap-2 px-2.5 w-full">
                                             {task.assignee && (
                                                 <div className="w-5 h-5 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-inner">
                                                     {task.assignee.firstName?.[0]}
                                                 </div>
                                             )}
                                             <span className="text-white text-[11px] font-bold truncate leading-none pt-0.5">{task.taskName}</span>
                                         </div>
                                         
                                         {/* Progress Indicator if status is inprogress */}
                                         {task.status === 'inprogress' && (
                                             <div className="absolute bottom-0 left-0 h-0.5 bg-white/40 w-[60%] animate-pulse"></div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         )) : (
                             <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                                 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                     <IoCalendarOutline size={32} />
                                 </div>
                                 <p className="text-slate-500 font-medium italic">No tasks planned for the selected timeframe.</p>
                             </div>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineBoard;
