import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  IoGridOutline, 
  IoBriefcaseOutline, 
  IoPeopleOutline, 
  IoSettingsOutline, 
  IoLogOutOutline,
  IoAdd,
  IoChevronDown,
  IoAnalyticsOutline
} from 'react-icons/io5';
import { ProjectApi } from '../../services/api/Project.api';
import { useSelector } from 'react-redux';

const Sidebar = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useSelector((state) => state.store);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await ProjectApi.getAllProjects();
                setProjects(res.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch sidebar projects", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const hiddenRoles = ["developer", "tester", "employee"];
    
    // Determine which items to show
    let menuItems = [
        { icon: <IoGridOutline />, label: 'Dashboard', path: '/' },
        { icon: <IoBriefcaseOutline />, label: 'Projects', path: '/project' },
        { icon: <IoPeopleOutline />, label: 'Teams', path: '/user' }, 
        { icon: <IoAnalyticsOutline />, label: 'Performance', path: '/performance' },
    ];

    if (hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase())) {
        menuItems = menuItems.filter(item => item.label !== 'Projects' && item.label !== 'Teams');
    }

    return (
        <aside className="w-64 bg-surface border-r border-borderLight h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                    M
                 </div>
                 <h1 className="text-xl font-bold text-textMain tracking-tight">Momentum</h1>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-4 text-xs font-semibold text-textSub uppercase tracking-wider mb-2 mt-4">Menu</p>
                {menuItems.map((item, idx) => (
                    <NavLink 
                        key={idx} 
                        to={item.path}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-primary/10 text-primary' : 'text-textSub hover:bg-slate-50 hover:text-textMain'}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}

                {/* Favorites/Projects Section */}
            {/* Favorites/Projects Section */}
                <div className="mt-8">
                     <div className="flex items-center justify-between px-4 mb-2">
                        <p className="text-xs font-semibold text-textSub uppercase tracking-wider">Projects</p>
                        {!hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase()) && (
                            <button 
                                className="text-textSub hover:text-primary transition-colors"
                                onClick={() => navigate('/project/create-project')}
                                title="Create Project"
                            >
                                <IoAdd size={16} />
                            </button>
                        )}
                     </div>
                     <div className="space-y-1">
                        {loading ? (
                            <p className="px-4 text-xs text-textSub">Loading...</p>
                        ) : projects.length > 0 ? (
                            projects.slice(0, 5).map((project, idx) => (
                                <button 
                                    key={project._id || idx} 
                                    onClick={() => navigate(`/task/dashboard?projectId=${project._id}`)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-textSub hover:bg-slate-50 hover:text-textMain transition-all text-left"
                                >
                                    <span className={`w-2 h-2 rounded-full bg-primary`}></span>
                                    <span className="truncate">{project.name}</span>
                                </button>
                            ))
                        ) : (
                            <p className="px-4 text-xs text-textSub italic">No projects found</p>
                        )}
                        {projects.length > 5 && (
                            <button 
                                onClick={() => navigate('/project')}
                                className="w-full px-4 py-1 text-xs text-primary hover:underline text-left"
                            >
                                View all
                            </button>
                        )}
                     </div>
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-borderLight">
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-textSub hover:bg-slate-50 hover:text-textMain w-full transition-all">
                    <IoSettingsOutline size={20} />
                    Settings
                </button>
                <button 
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-textRose hover:bg-rose-50 w-full transition-all mt-1 text-rose-500"
                >
                    <IoLogOutOutline size={20} />
                    Log Out
                </button>
            </div>
            
            {/* User Profile Mini */}
            <div className="p-4 mb-2 mx-2 bg-slate-50 rounded-xl flex items-center gap-3 border border-borderLight/50">
                 {currentUser?.profileImage ? (
                    <img src={currentUser.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                 ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${currentUser ? (currentUser.firstName + "+" + (currentUser.lastName || "")) : "User"}&background=random`} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full" 
                    />
                 )}
                 <div className="flex-1 min-w-0">
                     <p className="text-sm font-semibold text-textMain truncate">
                        {currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'User'}
                     </p>
                     <p className="text-xs text-textSub truncate">
                        {currentUser ? (currentUser.userRoles?.[0]?.name || currentUser.userRole?.name || "Role") : 'Role'}
                     </p>
                 </div>
                 <IoChevronDown className="text-textSub" />
            </div>
        </aside>
    );
};

export default Sidebar;
