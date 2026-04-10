
import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  IoGridOutline, 
  IoFlagOutline, 
  IoClipboardOutline, 
  IoRepeatOutline, 
  IoListOutline, 
  IoBarChartOutline, 
  IoSettingsOutline,
  IoArrowBackOutline
} from 'react-icons/io5';

const ProjectSidebar = ({ project }) => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const menuItems = [
        { icon: <IoGridOutline />, label: 'Overview', path: `/project/${projectId}/overview` },
        { icon: <IoFlagOutline />, label: 'Milestones', path: `/project/${projectId}/milestones` },
        { icon: <IoClipboardOutline />, label: 'Board', path: `/project/${projectId}/board` },
        { icon: <IoRepeatOutline />, label: 'Sprints', path: `/project/${projectId}/sprints` },
        { icon: <IoListOutline />, label: 'Backlog', path: `/project/${projectId}/backlog` },
        { icon: <IoSettingsOutline />, label: 'Settings', path: `/project/${projectId}/settings` },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-borderLight h-full flex flex-col absolute left-0 top-0 overflow-y-auto z-20">
            {/* Header / Back to Main Dashboard */}
            <div className="p-6">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-textSub hover:text-textMain transition-colors mb-4"
                >
                    <IoArrowBackOutline />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </button>
                <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold uppercase">
                        {project?.name?.charAt(0) || 'P'}
                     </div>
                     <div className="overflow-hidden">
                        <h1 className="text-sm font-bold text-textMain tracking-tight truncate" title={project?.name}>
                            {project?.name || 'Loading...'}
                        </h1>
                        <p className="text-xs text-textSub truncate">
                            {project?.category || 'Software Project'}
                        </p>
                     </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-4 text-xs font-semibold text-textSub uppercase tracking-wider mb-2 mt-4">Project Menu</p>
                {projectId ? menuItems.map((item, idx) => (
                    <NavLink 
                        key={idx} 
                        to={item.path}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-primary/10 text-primary' : 'text-textSub hover:bg-slate-50 hover:text-textMain'}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </NavLink>
                )) : (
                    <div className="px-4 py-2 text-sm text-yellow-600 bg-yellow-50 rounded-md">
                        No Project Selected
                    </div>
                )}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-borderLight">
                <div className="p-3 bg-slate-50 rounded-xl border border-borderLight/50">
                    <p className="text-xs font-semibold text-textMain mb-1">Sprint Progress</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-textSub">
                        <span>Sprint 12</span>
                        <span>4 days left</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default ProjectSidebar;
