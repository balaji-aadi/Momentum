import React, { useState } from 'react';
import moment from 'moment';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

const CalendarBoard = ({ tasks = [], isLoading }) => {
    const [currentDate, setCurrentDate] = useState(moment());

    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startOfCalendar = startOfMonth.clone().startOf('week');
    const endOfCalendar = endOfMonth.clone().endOf('week');

    const calendarDays = [];
    let day = startOfCalendar.clone();
    while (day.isBefore(endOfCalendar, 'day')) {
        calendarDays.push(day.clone());
        day.add(1, 'day');
    }

    const getTasksForDate = (date) => {
        return tasks.filter(task => moment(task.taskDueDate).isSame(date, 'day'));
    };

    const nextMonth = () => setCurrentDate(prev => prev.clone().add(1, 'month'));
    const prevMonth = () => setCurrentDate(prev => prev.clone().subtract(1, 'month'));
    const today = () => setCurrentDate(moment());

    if (isLoading) return <div className="p-8 text-center text-textSub">Loading calendar...</div>;

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-borderLight overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 flex items-center justify-between border-b border-borderLight">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-textMain">{currentDate.format('MMMM YYYY')}</h2>
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-textSub"><IoChevronBack /></button>
                        <button onClick={today} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded text-textMain border border-borderLight ml-2">Today</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-textSub"><IoChevronForward /></button>
                    </div>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-borderLight bg-bgLight">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="p-2 text-center text-xs font-semibold text-textSub uppercase">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {calendarDays.map((date, idx) => {
                    const isCurrentMonth = date.isSame(currentDate, 'month');
                    const isToday = date.isSame(moment(), 'day');
                    const dayTasks = getTasksForDate(date);

                    return (
                        <div 
                            key={idx} 
                            className={`min-h-[100px] border-b border-r border-borderLight p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50 ${!isCurrentMonth ? 'bg-slate-50/50 text-textSub/50' : 'bg-white'}`}
                        >
                            <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-white' : ''}`}>
                                {date.format('D')}
                            </div>
                            
                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] hide-scrollbar">
                                {dayTasks.map(task => (
                                    <div key={task._id} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate border-l-2 border-primary cursor-pointer hover:bg-primary/20">
                                        {task.taskName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarBoard;
