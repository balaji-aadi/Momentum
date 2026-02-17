import React, { useMemo } from 'react';
import moment from 'moment';

const TimelineBoard = ({ tasks = [], isLoading }) => {
    
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

    const getTaskStyle = (task) => {
        const start = task.taskStartDate ? moment(task.taskStartDate) : moment(task.createdAt);
        const end = task.taskDueDate ? moment(task.taskDueDate) : moment().add(1, 'day');
        
        const totalDuration = endDate.diff(startDate, 'days'); // Total days in view
        const startOffset = start.diff(startDate, 'days');
        const duration = end.diff(start, 'days') || 1;

        return {
            left: `${(startOffset / days.length) * 100}%`,
            width: `${(duration / days.length) * 100}%`,
        };
    };

    if (isLoading) return <div className="p-8 text-center text-textSub">Loading timeline...</div>;

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-borderLight overflow-hidden">
            <div className="flex-1 overflow-auto relative">
                <div className="min-w-[1200px]">
                     {/* Header: Months/Days */}
                     <div className="flex border-b border-borderLight sticky top-0 bg-white z-10">
                         <div className="w-64 flex-shrink-0 p-3 font-semibold text-textSub bg-bgLight">Task</div>
                         <div className="flex-1 flex">
                             {days.map((day, i) => (
                                 <div key={i} className={`flex-1 min-w-[30px] border-r border-borderLight text-center text-xs py-2 ${day.day() === 0 || day.day() === 6 ? 'bg-bgLight' : ''}`}>
                                    <div className="font-bold">{day.format('DD')}</div>
                                    <div className="text-[10px] text-textSub uppercase">{day.format('ddd')}</div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Body: Tasks */}
                     <div className="divide-y divide-borderLight">
                         {tasks.map(task => (
                             <div key={task._id} className="flex hover:bg-slate-50 relative group">
                                 <div className="w-64 flex-shrink-0 p-3 text-sm font-medium text-textMain truncate border-r border-borderLight bg-white sticky left-0 z-10">
                                     {task.taskName}
                                 </div>
                                 <div className="flex-1 relative py-2">
                                     {/* Background Grid */}
                                     <div className="absolute inset-0 flex pointer-events-none">
                                         {days.map((day, i) => (
                                             <div key={i} className={`flex-1 border-r border-borderLight ${day.day() === 0 || day.day() === 6 ? 'bg-bgLight/30' : ''}`}></div>
                                         ))}
                                     </div>

                                     {/* Task Bar */}
                                     <div 
                                        className="relative h-6 bg-primary rounded-md shadow-sm mx-1 cursor-pointer hover:bg-primaryHover transition-colors"
                                        style={getTaskStyle(task)}
                                        title={`${task.taskName}: ${moment(task.taskStartDate || task.createdAt).format('MMM D')} - ${moment(task.taskDueDate).format('MMM D')}`}
                                     >
                                         <div className="text-white text-xs px-2 py-1 truncate">{task.taskName}</div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineBoard;
