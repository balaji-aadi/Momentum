import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    IoGridOutline,
    IoBriefcaseOutline,
    IoPeopleOutline,
    IoSettingsOutline,
    IoLogOutOutline,
    IoAdd,
    IoTimeOutline,
    IoSyncOutline,
    IoBusinessOutline
} from 'react-icons/io5';
import { ProjectApi } from '../../services/api/Project.api';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapsed } from '../../store/slices/storeSlice';
import GlobalTimerWidget from './GlobalTimerWidget';
import toast from 'react-hot-toast';

// Custom Sidebar Collapse Toggle Icon matching exact design in screenshot
const SidebarCollapseIcon = ({ className = "w-5 h-5" }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
        <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentUser, activeBranch, globalSettings, dailyRevision, isSidebarCollapsed } = useSelector((state) => state.store);
    const isRevisionLocked = dailyRevision && dailyRevision.isStarted && !dailyRevision.isCompleted;
    const noBranchLocked = !activeBranch;

    const { slug } = useParams();
    const currentProjectId = searchParams.get('projectId');

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

        if (activeBranch) {
            fetchProjects();
        }

        const handleProjectUpdate = () => {
            if (activeBranch) fetchProjects();
        };
        window.addEventListener('projectCreated', handleProjectUpdate);

        return () => {
            window.removeEventListener('projectCreated', handleProjectUpdate);
        };
    }, [activeBranch]);

    const hiddenRoles = ["developer", "tester", "employee"];

    let menuItems = [
        { icon: <IoGridOutline />, label: 'Dashboard', path: '/' },
        { icon: <IoBusinessOutline />, label: 'Modules', path: '/branch' },
        { icon: <IoTimeOutline />, label: 'Focus Timer', path: '/focus-timer' },
        { icon: <IoSyncOutline />, label: 'Revision', path: '/revision' },
        { icon: <IoBriefcaseOutline />, label: 'Arenas', path: '/arenas' },
        { icon: <IoPeopleOutline />, label: 'Users', path: '/user' },
        { icon: <IoTimeOutline />, label: 'Pricing', path: '/pricing' },
    ];

    const isAdmin = currentUser?.email === "balajiaadi2000@gmail.com";

    if (hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase())) {
        menuItems = menuItems.filter(item => item.label !== 'Arenas' && item.label !== 'Users');
    }

    if (!isAdmin) {
        menuItems = menuItems.filter(item => item.label !== 'Users');
        if (globalSettings?.subscriptionType !== 'paid') {
            menuItems = menuItems.filter(item => item.label !== 'Pricing');
        }
    } else {
        menuItems = menuItems.filter(item => item.label !== 'Pricing');
    }

    const topMenuItems = menuItems.filter(item => ['Modules', 'Users'].includes(item.label));
    const mainMenuItems = menuItems.filter(item => !['Modules', 'Users', 'Pricing'].includes(item.label));
    const pricingItem = menuItems.find(item => item.label === 'Pricing');

    const handleLogout = () => {
        const keysToPreserve = [
            "focus_timer_state",
            "focus_timer_task_binding",
            "focus_timer_retrievable",
            "sarathi_show_topbar",
            "projectTabsOrder",
            "dontShowInProgressToast"
        ];
        const preserved = {};
        keysToPreserve.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) preserved[key] = val;
        });

        localStorage.clear();

        Object.entries(preserved).forEach(([key, val]) => {
            localStorage.setItem(key, val);
        });

        window.location.href = "/login";
    };

    return (
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-surface border-r border-borderLight h-full flex flex-col fixed lg:absolute left-0 top-0 overflow-y-auto z-[150] lg:z-20 transition-all duration-300 ease-in-out scrollbar-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            {/* Logo & Sidebar Collapser Header */}
            <div className={`p-4 flex items-center justify-between border-b border-slate-100/60 ${isSidebarCollapsed ? 'px-3 flex-col gap-3 py-4' : 'px-5 py-5'}`}>
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <img src="/momentum_logo.svg" alt="Sarathi Logo" className="w-8 h-8 object-contain drop-shadow-md shrink-0" />
                    {!isSidebarCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-xl font-bold text-textMain tracking-tight leading-none truncate">Sarathi</h1>
                            {activeBranch ? (
                                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-70 truncate">
                                    {activeBranch.name}
                                </span>
                            ) : (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] mt-1 opacity-80 truncate">
                                    Select Module
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Collapser Button matching screenshot */}
                <button
                    onClick={() => dispatch(toggleSidebarCollapsed())}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer border border-slate-200/50 hover:border-slate-300 shadow-sm shrink-0 bg-white"
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <SidebarCollapseIcon className="w-5 h-5 text-slate-700 transition-transform duration-300" />
                </button>
            </div>

            {/* Global Timer Active Widget */}
            {!isSidebarCollapsed && activeBranch && <GlobalTimerWidget />}

            {/* Main Navigation */}
            <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'px-2 py-4' : 'px-4 py-2'}`}>
                {/* Top Section: Modules & Users */}
                <div className="space-y-1">
                    {topMenuItems.map((item, idx) => {
                        const isModulesTab = item.label === 'Modules';
                        const itemLocked = (!isModulesTab && noBranchLocked) || (isModulesTab ? false : isRevisionLocked);

                        return (
                            <NavLink
                                key={`top-${idx}`}
                                to={itemLocked ? '#' : item.path}
                                title={isSidebarCollapsed ? item.label : undefined}
                                onClick={(e) => {
                                    if (noBranchLocked && !isModulesTab) {
                                        e.preventDefault();
                                        toast.error("Please select a Module to enter the workspace!");
                                        return;
                                    }
                                    if (isRevisionLocked && !isModulesTab) {
                                        e.preventDefault();
                                        toast.error("Complete your Daily Revision to unlock other tabs!");
                                        return;
                                    }
                                    if (setIsOpen) setIsOpen(false);
                                }}
                                className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2.5'} rounded-xl transition-all duration-200 group relative ${itemLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'active bg-primary/10 text-primary font-black' : 'text-textSub hover:text-textMain hover:bg-slate-50')}`}
                            >
                                <span className="text-lg opacity-70 group-[.active]:opacity-100 group-[.active]:text-primary shrink-0">
                                    {item.icon}
                                </span>
                                {!isSidebarCollapsed && (
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <span className="text-[13px] font-bold group-[.active]:text-primary transition-all uppercase tracking-wider truncate">
                                            {item.label}
                                        </span>
                                        {itemLocked && <span className="text-slate-400 text-xs shrink-0 ml-auto">🔒</span>}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Thin Line Separator */}
                <div className={`h-[1px] bg-slate-100/80 my-4 ${isSidebarCollapsed ? 'mx-1' : 'mx-2'}`}></div>

                {/* Main Section */}
                <div className="space-y-1">
                    {mainMenuItems.map((item, idx) => {
                        const isRevisionTab = item.label === 'Revision';
                        const itemLocked = noBranchLocked || (isRevisionLocked && !isRevisionTab);
                        return (
                            <NavLink
                                key={`main-${idx}`}
                                to={itemLocked ? '#' : item.path}
                                title={isSidebarCollapsed ? item.label : undefined}
                                onClick={(e) => {
                                    if (noBranchLocked) {
                                        e.preventDefault();
                                        toast.error("Please select a Module to enter the workspace!");
                                        return;
                                    }
                                    if (isRevisionLocked && !isRevisionTab) {
                                        e.preventDefault();
                                        toast.error("Complete your Daily Revision to unlock other tabs!");
                                        return;
                                    }
                                    if (item.label === 'Dashboard') {
                                        navigate('/');
                                    }
                                    if (setIsOpen) setIsOpen(false);
                                }}
                                className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2'} rounded-xl transition-all duration-200 group relative ${itemLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'active text-primary bg-primary/5 font-black' : 'text-textSub hover:text-textMain hover:bg-slate-50')}`}
                            >
                                {!isSidebarCollapsed && (
                                    <span className="w-1 h-1 rounded-full transition-all group-[.active]:bg-primary bg-transparent shrink-0"></span>
                                )}
                                <span className="text-base opacity-70 group-[.active]:opacity-100 shrink-0">
                                    {item.icon}
                                </span>
                                {!isSidebarCollapsed && (
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <span className="text-[13px] font-semibold group-[.active]:font-black truncate">
                                            {item.label}
                                        </span>
                                        {itemLocked && <span className="text-slate-400 text-xs shrink-0 ml-auto">🔒</span>}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* Pricing (Conditional) */}
                    {pricingItem && (
                        <NavLink
                            to={noBranchLocked ? '#' : pricingItem.path}
                            title={isSidebarCollapsed ? pricingItem.label : undefined}
                            onClick={(e) => {
                                if (noBranchLocked) {
                                    e.preventDefault();
                                    toast.error("Please select a Module to enter the workspace!");
                                    return;
                                }
                                if (setIsOpen) setIsOpen(false);
                            }}
                            className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2'} rounded-xl transition-all duration-200 group relative ${noBranchLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'active text-primary bg-primary/5' : 'text-textSub hover:text-textMain hover:bg-slate-50')}`}
                        >
                            {!isSidebarCollapsed && (
                                <span className="w-1 h-1 rounded-full transition-all group-[.active]:bg-primary bg-transparent shrink-0"></span>
                            )}
                            <span className="text-base opacity-70 group-[.active]:opacity-100 shrink-0">
                                {pricingItem.icon}
                            </span>
                            {!isSidebarCollapsed && (
                                <div className="flex items-center justify-between w-full min-w-0">
                                    <span className="text-[13px] font-semibold group-[.active]:font-black truncate">
                                        {pricingItem.label}
                                    </span>
                                    {noBranchLocked && <span className="text-slate-400 text-xs shrink-0 ml-auto">🔒</span>}
                                </div>
                            )}
                        </NavLink>
                    )}
                </div>

                {/* Favorites/Projects Section */}
                <div className="mt-6">
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center justify-between px-4 mb-2">
                            <p className="text-xs font-semibold text-textSub uppercase tracking-wider">Arenas</p>
                            {!hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase()) && (
                                <button
                                    className={`text-textSub hover:text-primary transition-colors ${noBranchLocked ? 'opacity-40 pointer-events-none' : ''}`}
                                    onClick={() => {
                                        if (noBranchLocked) return;
                                        navigate('/arenas/create-project');
                                        if (setIsOpen) setIsOpen(false);
                                    }}
                                    title="Create Arena"
                                >
                                    <IoAdd size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="h-[1px] bg-slate-100/80 my-4 mx-1"></div>
                    )}

                    <div className="space-y-1">
                        {noBranchLocked ? (
                            !isSidebarCollapsed && <p className="px-4 text-[11px] text-textSub italic">Select a module to view arenas</p>
                        ) : loading ? (
                            !isSidebarCollapsed && <p className="px-4 text-xs text-textSub">Loading...</p>
                        ) : projects.length > 0 ? (
                            projects.slice(0, 10).map((project, idx) => {
                                const projectSlug = project.key?.toLowerCase() || project.name.toLowerCase().replace(/\s+/g, '-');
                                const isActive = slug ? slug === projectSlug : currentProjectId === project._id;
                                return (
                                    <div
                                        key={project._id || idx}
                                        title={isSidebarCollapsed ? project.name : undefined}
                                        onClick={() => {
                                            if (noBranchLocked) {
                                                toast.error("Please select a Module to enter the workspace!");
                                                return;
                                            }
                                            if (isRevisionLocked) {
                                                toast.error("Complete your Daily Revision to unlock other arenas!");
                                                return;
                                            }
                                            navigate(`/arena/${projectSlug}`);
                                            if (setIsOpen) setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'justify-between px-4 py-1.5'} cursor-pointer transition-all group rounded-xl ${noBranchLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'text-primary' : 'text-textSub/80 hover:text-textMain hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 transition-all ${isActive ? 'bg-primary shadow-[0_0_8px_rgba(227,66,52,0.6)]' : 'bg-slate-300'}`}></span>
                                            {!isSidebarCollapsed && (
                                                <span className={`text-xs font-bold truncate ${isActive ? 'underline underline-offset-4 decoration-primary/30' : 'group-hover:underline underline-offset-4 decoration-slate-200'}`}>
                                                    {project.name}
                                                </span>
                                            )}
                                        </div>
                                        {!isSidebarCollapsed && noBranchLocked && <span className="text-slate-400 text-[10px] shrink-0">🔒</span>}
                                    </div>
                                );
                            })
                        ) : (
                            !isSidebarCollapsed && <p className="px-4 text-xs text-textSub italic">No arenas found</p>
                        )}
                    </div>
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className={`mt-auto border-t border-slate-100/50 ${isSidebarCollapsed ? 'p-2 space-y-2' : 'px-4 py-5 space-y-3'}`}>
                {/* Settings Item */}
                <MenuItem 
                    icon={<IoSettingsOutline />} 
                    label="Settings" 
                    path="/settings" 
                    isActive={window.location.pathname === '/settings'} 
                    onClick={() => setIsOpen && setIsOpen(false)}
                    isLocked={noBranchLocked || isRevisionLocked}
                    isCollapsed={isSidebarCollapsed}
                />

                {/* User Profile Section */}
                {!isSidebarCollapsed ? (
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                        <div className="relative flex items-center gap-3">
                            <div className="relative shrink-0">
                                {currentUser?.profileImage ? (
                                    <img src={currentUser.profileImage} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-white" />
                                ) : (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${currentUser ? (currentUser.firstName + "+" + (currentUser.lastName || "")) : "User"}&background=E34234&color=fff&bold=true`}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border border-white shadow-sm"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-black text-slate-800 truncate tracking-tight leading-none">
                                    {currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'User'}
                                </p>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-1">
                                    {isAdmin ? "System Admin" : "Member"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-3 w-full py-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest border border-slate-200/60"
                        >
                            <IoLogOutOutline size={13} />
                            Logout Session
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        title="Logout Session"
                        className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center border border-slate-200/60 cursor-pointer"
                    >
                        <IoLogOutOutline size={16} />
                    </button>
                )}
            </div>
        </aside>
    );
};

const MenuItem = ({ icon, label, path, isActive, onClick, isLocked, isCollapsed }) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => {
                if (isLocked) {
                    toast.error("Complete your Daily Revision to unlock Settings!");
                    return;
                }
                navigate(path);
                if (onClick) onClick();
            }}
            title={isCollapsed ? label : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-4 py-2.5'} rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive
                ? 'text-primary font-black bg-primary/5'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} relative z-10 w-full`}>
                <span className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
                    {React.cloneElement(icon, { size: 17 })}
                </span>
                {!isCollapsed && <span className="text-[13px] tracking-tight font-bold truncate">{label}</span>}
            </div>
            {!isCollapsed && isLocked && <span className="text-slate-400 text-xs shrink-0 relative z-10">🔒</span>}
        </button>
    );
};

export default Sidebar;
