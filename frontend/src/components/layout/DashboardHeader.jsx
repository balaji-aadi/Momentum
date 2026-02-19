import { IoAdd, IoFilterOutline, IoGridOutline, IoListOutline, IoCalendarOutline, IoTimeOutline, IoRepeatOutline } from 'react-icons/io5';
import InputField from '../InputField';

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
    onCreateTask,
    isManager
}) => {

    const tabs = [
        { id: 'spreadsheet', label: 'Spreadsheet', icon: <IoListOutline /> },
        { id: 'timeline', label: 'Timeline', icon: <IoTimeOutline /> },
        { id: 'calendar', label: 'Calendar', icon: <IoCalendarOutline /> },
        { id: 'board', label: 'Board', icon: <IoGridOutline /> },
        { id: 'sprints', label: 'Sprints', icon: <IoRepeatOutline /> },
    ];

    return (
        <div className="bg-surface border-b border-borderLight px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
            {/* Left: View Tabs */}
            <div className="flex items-center gap-1 bg-bgLight p-1 rounded-xl overflow-x-auto hide-scrollbar w-full xl:w-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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

            {/* Right: Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
                     <IoFilterOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textSub pointer-events-none" />
                     <input 
                        type="text" 
                        placeholder="Search task..." 
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-borderLight bg-bgLight text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 w-full xl:w-64 transition-all"
                     />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-2 flex-grow xl:flex-grow-0">
                    {/* Project Filter */}
                    <div className="min-w-[140px] flex-grow xl:flex-grow-0">
                        <select 
                            value={selectedProject} 
                            onChange={(e) => onProjectChange(e.target.value)}
                            className="w-full px-3 py-2 border border-borderLight rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer"
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.value} value={p.value} label={p.label}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Member Filter */}
                    <div className="min-w-[140px] flex-grow xl:flex-grow-0">
                         <select 
                            value={selectedMember} 
                            onChange={(e) => onMemberChange(e.target.value)}
                            className="w-full px-3 py-2 border border-borderLight rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer"
                        >
                            <option value="">All Members</option>
                            {members.map(m => (
                                <option key={m.value} value={m.value} label={m.label}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Create Task Button */}
                <button
                    className="bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-xl font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform active:scale-95 flex-grow xl:flex-grow-0 whitespace-nowrap min-w-[140px]"
                    onClick={onCreateTask}
                    disabled={!isManager}
                >
                    <IoAdd size={20} />
                    <span>Create Task</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
