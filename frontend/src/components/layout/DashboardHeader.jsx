import {
    IoAdd,
    IoFilterOutline,
    IoGridOutline,
    IoListOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoChevronDownOutline,
    IoSearchOutline,
    IoCloseOutline,
    IoChevronUpOutline
} from 'react-icons/io5';
import { MdFilterAltOff } from 'react-icons/md';
import Select, { components } from 'react-select';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    sortBy,
    onSortChange,
    parentId,
    onParentChange,
    parentTasks,
    onHideControls,
    onOpenSchedule,
    hasProjectSelected,
    isArenaScheduled,
    isDataLoaded
}) => {

    const tabs = [
        { id: 'board', label: 'Board', icon: <IoGridOutline /> },
        { id: 'spreadsheet', label: 'Spreadsheet', icon: <IoListOutline /> },
        { id: 'timeline', label: 'Timeline', icon: <IoTimeOutline /> },
        { id: 'calendar', label: 'Calendar', icon: <IoCalendarOutline /> },
    ];

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Highly premium custom styles for React-Select with sleek compact sizing
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '34px',
            height: '34px',
            backgroundColor: '#ffffff',
            borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
            borderRadius: '0.625rem',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#1e293b',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            paddingLeft: '2px',
            '&:hover': {
                borderColor: state.isFocused ? '#6366f1' : '#cbd5e1'
            }
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 6px',
        }),
        input: (provided) => ({
            ...provided,
            margin: '0px',
            color: '#1e293b',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '32px',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#1e293b',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#94a3b8',
            fontWeight: '500',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px border #f1f5f9',
            padding: '4px',
            zIndex: 100,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        menuList: (provided) => ({
            ...provided,
            padding: '0px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '0.75rem',
            fontWeight: '600',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            padding: '6px 10px',
            color: state.isSelected ? '#ffffff' : '#334155',
            backgroundColor: state.isSelected
                ? '#6366f1'
                : state.isFocused
                    ? '#f1f5f9'
                    : 'transparent',
            transition: 'all 0.15s ease',
            '&:active': {
                backgroundColor: state.isSelected ? '#6366f1' : '#e2e8f0'
            }
        })
    };

    const CustomMenuList = (props) => {
        return (
            <components.MenuList {...props}>
                <div className="px-2.5 py-1 border-b border-slate-100 bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Quick search...
                </div>
                {props.children}
            </components.MenuList>
        );
    };

    const CustomDropdownIndicator = (props) => {
        return (
            <components.DropdownIndicator {...props}>
                <IoChevronDownOutline
                    size={12}
                    className="text-slate-400 mr-1.5 transition-transform duration-300"
                    style={{ transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none' }}
                />
            </components.DropdownIndicator>
        );
    };

    const isAnyFilterActive = search || sortBy || parentId || selectedProject || selectedMember;

    return (
        <div className="bg-white/90 backdrop-blur-md px-3 py-2.5 flex flex-col gap-2.5 sticky top-0 z-[80] border-b border-slate-100 shadow-sm w-full">
            {/* Top Row: Navigation View Tabs & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                {/* Navigation View Tabs */}
                <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/40 w-full overflow-x-auto sm:w-fit scrollbar-none flex-nowrap shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 relative shrink-0 ${viewMode === tab.id
                                    ? 'text-slate-900 font-black'
                                    : 'text-slate-500 hover:text-slate-700 font-bold'
                                }`}
                        >
                            {viewMode === tab.id && (
                                <motion.div
                                    layoutId="header-tab-active"
                                    className="absolute inset-0 bg-white shadow-sm rounded-lg border border-slate-200/30"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                />
                            )}
                            <span className="relative z-10">
                                {React.cloneElement(tab.icon, { size: 13 })}
                            </span>
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Actions (Schedule Arena, Hide Controls, Refine View, Create Task) */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    {onOpenSchedule && hasProjectSelected && !isArenaScheduled && (
                        <button
                            onClick={onOpenSchedule}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Generate and apply custom timeline schedule for this Arena"
                        >
                            <IoCalendarOutline size={14} className="text-white" />
                            <span>Schedule Arena</span>
                        </button>
                    )}

                    {onHideControls && (
                        <button
                            onClick={onHideControls}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                            title="Hide controls header"
                        >
                            <IoChevronUpOutline size={13} />
                            <span>Hide Controls</span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${isFiltersOpen
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                    >
                        <IoFilterOutline size={13} className={isFiltersOpen ? "rotate-180 transition-transform duration-300" : ""} />
                        <span>{isFiltersOpen ? 'Close Refine' : 'Refine View'}</span>
                        {isAnyFilterActive && !isFiltersOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        )}
                    </button>

                    {canCreate && (
                        <button
                            onClick={onCreateTask}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            <IoAdd size={15} className="text-white" />
                            <span>Create Task</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Expandable Refine View Controls Bar */}
            <AnimatePresence>
                {isFiltersOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 2 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden w-full"
                    >
                        <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Refine & Filter View</span>
                                {isAnyFilterActive && (
                                    <button
                                        onClick={onResetFilters}
                                        className="text-[9px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-all"
                                    >
                                        <MdFilterAltOff size={12} />
                                        <span>Reset All</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2.5 w-full">
                                {/* Search Bar */}
                                <div className="relative flex-grow min-w-[180px] max-w-full lg:max-w-xs">
                                    <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Find a task..."
                                        value={search}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 w-full h-[34px] transition-all"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => onSearchChange('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <IoCloseOutline size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Date Sort Selector */}
                                <div className="min-w-[140px] flex-grow lg:flex-grow-0 z-[60]">
                                    <Select
                                        value={sortBy ? { value: sortBy, label: sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : sortBy === 'deadlineSoon' ? 'Deadline Soon' : 'Deadline Late' } : null}
                                        onChange={(option) => onSortChange(option ? option.value : "")}
                                        options={[
                                            { value: "newest", label: "Newest First" },
                                            { value: "oldest", label: "Oldest First" },
                                            { value: "deadlineSoon", label: "Deadline Soon" },
                                            { value: "deadlineLate", label: "Deadline Late" }
                                        ]}
                                        placeholder="Sort By"
                                        isSearchable={true}
                                        styles={customStyles}
                                        components={{
                                            MenuList: CustomMenuList,
                                            DropdownIndicator: CustomDropdownIndicator
                                        }}
                                        isClearable={true}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                {/* Parent Task Selector */}
                                <div className="min-w-[150px] flex-grow lg:flex-grow-0 z-[50]">
                                    <Select
                                        value={parentId ? { value: parentId, label: parentTasks.find(t => t._id === parentId)?.taskName || "Unknown" } : null}
                                        onChange={(option) => onParentChange(option ? option.value : "")}
                                        options={parentTasks.map(t => ({ value: t._id, label: t.taskName }))}
                                        placeholder="All Parents"
                                        isSearchable={true}
                                        styles={customStyles}
                                        components={{
                                            MenuList: CustomMenuList,
                                            DropdownIndicator: CustomDropdownIndicator
                                        }}
                                        isClearable={true}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                {/* Project Selector (Arena) */}
                                <div className="min-w-[150px] flex-grow lg:flex-grow-0 z-[40]">
                                    <Select
                                        value={selectedProject ? { value: selectedProject, label: projects.find(p => p.value === selectedProject)?.label || "Unknown" } : null}
                                        onChange={(option) => onProjectChange(option ? option.value : "")}
                                        options={projects}
                                        placeholder="All Arenas"
                                        isSearchable={true}
                                        styles={customStyles}
                                        components={{
                                            MenuList: CustomMenuList,
                                            DropdownIndicator: CustomDropdownIndicator
                                        }}
                                        isClearable={true}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                {/* Member Selector (Only for Managers/Admins) */}
                                {(isManager || isAdmin) && (
                                    <div className="min-w-[150px] flex-grow lg:flex-grow-0 z-[30]">
                                        <Select
                                            value={selectedMember ? { value: selectedMember, label: members.find(m => m.value === selectedMember)?.label || "Unknown" } : null}
                                            onChange={(option) => onMemberChange(option ? option.value : "")}
                                            options={members}
                                            placeholder="All Members"
                                            isSearchable={true}
                                            styles={customStyles}
                                            components={{
                                                MenuList: CustomMenuList,
                                                DropdownIndicator: CustomDropdownIndicator
                                            }}
                                            isClearable={true}
                                            menuPortalTarget={document.body}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardHeader;
