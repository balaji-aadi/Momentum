import { IoAdd, IoFilterOutline, IoGridOutline, IoListOutline, IoCalendarOutline, IoTimeOutline, IoRepeatOutline, IoChevronUpOutline, IoChevronDownOutline } from 'react-icons/io5';
import { MdFilterAltOff } from 'react-icons/md';
import { useState } from 'react';

const DashboardHeader = ({ 
    viewMode, 
    setViewMode, 
    projects, 
    members, 
    selectedProject, 
    onProjectChange, 
    selectedMember, 
    onMemberChange,
    search,
    onSearchChange,
    onResetFilters,
    onCreateTask,
    isManager,
    isAdmin,
    canCreate,
    dateFilter,
    onDateChange
}) => {

    const tabs = [
        { id: 'spreadsheet', label: 'Spreadsheet', icon: <IoListOutline /> },
        { id: 'timeline', label: 'Timeline', icon: <IoTimeOutline /> },
        { id: 'calendar', label: 'Calendar', icon: <IoCalendarOutline /> },
        { id: 'board', label: 'Board', icon: <IoGridOutline /> },
        { id: 'sprints', label: 'Sprints', icon: <IoRepeatOutline /> },
    ];

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    return (
        <div className="bg-surface border-b border-borderLight px-4 sm:px-6 py-2 flex flex-col items-start xl:items-center gap-2 sticky top-0 z-20 shadow-sm transition-all">
            <div className="flex w-full justify-between items-center xl:flex-row-reverse">
                {/* Left: View Tabs */}
                <div className="flex items-center gap-1 bg-bgLight p-1 rounded-xl overflow-x-auto hide-scrollbar w-full xl:w-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            viewMode === tab.id 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-textSub hover:text-textMain hover:bg-white/50'
                        }`}
                    >
                        <span className="hidden sm:inline">{tab.icon}</span>
                        {tab.label}
                    </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 ml-auto xl:ml-2">
                    {/* Desktop Toggle Button */}
                    <div className="hidden xl:flex items-center">
                        <button 
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-textSub hover:text-primary transition-colors flex shrink-0 items-center justify-center text-sm font-medium gap-1 h-[34px]"
                        >
                            {isFiltersOpen ? <><IoChevronUpOutline size={16} /> Hide Filters</> : <><IoFilterOutline size={16} /> Show Filters</>}
                        </button>
                    </div>

                    {/* Create Task Button (Always Visible) */}
                    {canCreate && (
                        <button
                            className="bg-primary hover:bg-primaryHover text-white px-3 py-1.5 sm:px-4 rounded-lg font-semibold shadow-md shadow-primary/30 flex items-center justify-center gap-1 transition-transform active:scale-95 whitespace-nowrap text-sm"
                            onClick={onCreateTask}
                        >
                            <IoAdd size={18} />
                            <span className="hidden sm:inline">Create Task</span>
                        </button>
                    )}

                    {/* Mobile Toggle Filters Button */}
                    <button 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="xl:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-textSub hover:text-primary transition-colors flex shrink-0 items-center justify-center"
                        title="Toggle Filters"
                    >
                        {isFiltersOpen ? <IoChevronUpOutline size={20} /> : <IoChevronDownOutline size={20} />}
                    </button>
                </div>
            </div>

            {/* Right: Filters & Actions */}
            <div className={`flex flex-wrap items-center justify-end gap-2 w-full xl:w-auto transition-all duration-300 overflow-hidden ${isFiltersOpen ? 'max-h-[500px] opacity-100 mt-2 xl:mt-0' : 'max-h-0 opacity-0 xl:mt-0'}`}>
                
                <div className={`flex flex-wrap items-center justify-end gap-2 w-full transition-all ${isFiltersOpen ? 'flex' : 'hidden'}`}>
                    {/* Search */}
                    <div className="relative flex-grow min-w-[180px]">
                     <IoFilterOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textSub pointer-events-none" />
                     <input 
                        type="text" 
                        placeholder="Search task..." 
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-3 py-1.5 rounded-lg border border-borderLight bg-bgLight text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 w-full xl:w-64 transition-all"
                     />
                </div>

                {/* Reset Filters */}
                <button 
                   onClick={onResetFilters}
                   className="p-1.5 aspect-square rounded-lg bg-bgLight border border-borderLight text-textSub hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                   title="Clear all filters"
                >
                   <MdFilterAltOff size={18} />
                </button>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-2 flex-grow xl:flex-grow-0">
                    {/* Date Filter */}
                    <div className="min-w-[120px] flex-grow xl:flex-grow-0">
                        <select 
                            value={dateFilter || ""}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-full px-2 py-1.5 border border-borderLight rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer"
                        >
                            <option value="">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>

                    {/* Project Filter */}
                    <div className="min-w-[130px] flex-grow xl:flex-grow-0">
                        <select 
                            value={selectedProject} 
                            onChange={(e) => onProjectChange(e.target.value)}
                            className="w-full px-2 py-1.5 border border-borderLight rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer"
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.value} value={p.value} label={p.label}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Member Filter - Only for Managers/Admins */}
                    {(isManager || isAdmin) && (
                        <div className="min-w-[130px] flex-grow xl:flex-grow-0">
                            <select 
                                value={selectedMember} 
                                onChange={(e) => onMemberChange(e.target.value)}
                                className="w-full px-2 py-1.5 border border-borderLight rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer"
                            >
                                <option value="">All Members</option>
                                {members.map(m => (
                                    <option key={m.value} value={m.value} label={m.label}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
};

export default DashboardHeader;
