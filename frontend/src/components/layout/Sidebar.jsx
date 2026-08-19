import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoGridOutline,
    IoBriefcaseOutline,
    IoPeopleOutline,
    IoSettingsOutline,
    IoLogOutOutline,
    IoAdd,
    IoTimeOutline,
    IoSyncOutline,
    IoBusinessOutline,
    IoCodeSlashOutline,
    IoAddCircleOutline,
    IoBookOutline,
    IoLayersOutline,
    IoTerminalOutline,
    IoChevronDownOutline,
    IoLockClosedOutline,
    IoSparklesOutline
} from 'react-icons/io5';
import { ProjectApi } from '../../services/api/Project.api';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapsed } from '../../store/slices/storeSlice';
import GlobalTimerWidget from './GlobalTimerWidget';
import toast from 'react-hot-toast';

// Modern Sidebar Collapse Toggle Icon
const SidebarCollapseIcon = ({ className = "w-4 h-4", collapsed = false }) => (
    <svg
        className={`${className} transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <path d="M15 9l-3 3 3 3" />
    </svg>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentUser, activeBranch, globalSettings, dailyRevision, isSidebarCollapsed } = useSelector((state) => state.store);
    const isRevisionLocked = dailyRevision && dailyRevision.isEligible === true && dailyRevision.questions?.length > 0 && dailyRevision.isStarted && !dailyRevision.isCompleted;
    const noBranchLocked = !activeBranch;

    const { slug } = useParams();
    const currentProjectId = searchParams.get('projectId');
    const location = useLocation();
    const [isDsaOpen, setIsDsaOpen] = useState(() => location.pathname.startsWith('/dsa-management'));

    useEffect(() => {
        if (location.pathname.startsWith('/dsa-management')) {
            setIsDsaOpen(true);
        }
    }, [location.pathname]);

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

    const dsaSubRoutes = [
        { label: 'Problems', path: '/dsa-management/problems', icon: <IoCodeSlashOutline /> },
        { label: 'Create Problem', path: '/dsa-management/create-problem', icon: <IoAddCircleOutline /> },
        { label: 'Companies', path: '/dsa-management/companies', icon: <IoBusinessOutline /> },
        { label: 'Topics', path: '/dsa-management/topics', icon: <IoBookOutline /> },
        { label: 'Patterns', path: '/dsa-management/patterns', icon: <IoLayersOutline /> },
        { label: 'Languages', path: '/dsa-management/languages', icon: <IoTerminalOutline /> }
    ];

    return (
        <aside className={`${isSidebarCollapsed ? 'w-16 lg:w-20' : 'w-64 lg:w-72'} fixed lg:absolute left-0 top-0 bottom-0 p-2 lg:p-3 h-full z-[150] lg:z-20 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className={`bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-2xl lg:rounded-3xl h-full flex flex-col relative ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-hidden'}`}>

                {/* Header (Clean & Compact) */}
                <div className={`flex items-center justify-between border-b border-slate-100 ${isSidebarCollapsed ? 'px-2 flex-col gap-2 py-3' : 'px-3.5 py-3'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img src="/momentum_logo.svg" alt="Sarathi Logo" className="w-7 h-7 object-contain shrink-0" />
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Sarathi</h1>
                                {activeBranch ? (
                                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                                        <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">
                                            {activeBranch.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                        <span className="text-[11px] font-semibold text-amber-600 truncate">
                                            Select Module
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => dispatch(toggleSidebarCollapsed())}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <SidebarCollapseIcon collapsed={isSidebarCollapsed} className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Global Timer Active Widget */}
                {!isSidebarCollapsed && activeBranch && (
                    <div className="mx-2.5 mt-2">
                        <GlobalTimerWidget />
                    </div>
                )}

                {/* Scrollable Navigation Body */}
                <nav className={`flex-1 space-y-3 scrollbar-none ${isSidebarCollapsed ? 'px-2 py-3 overflow-visible' : 'px-2.5 py-2.5 overflow-y-auto'}`}>
                    {/* Top Workspace Items (Modules, Users) */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">
                                Workspace
                            </p>
                        )}
                        <div className="space-y-0.5">
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
                                        className={({ isActive }) => `relative flex items-center ${isSidebarCollapsed ? 'justify-center py-2 px-0' : 'px-2.5 py-1.5 gap-2.5'} rounded-xl transition-all duration-150 group select-none ${itemLocked ? 'opacity-40 cursor-not-allowed text-slate-400' : (isActive ? 'bg-primary/10 text-primary font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70')}`}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                                )}
                                                <span className={`text-base shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                                    {item.icon}
                                                </span>
                                                {!isSidebarCollapsed && (
                                                    <div className="flex items-center justify-between w-full min-w-0">
                                                        <span className="text-[13px] tracking-tight truncate">
                                                            {item.label}
                                                        </span>
                                                        {itemLocked && <IoLockClosedOutline className="text-slate-400 text-xs shrink-0 ml-auto" />}
                                                    </div>
                                                )}
                                                {isSidebarCollapsed && (
                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                                        {item.label}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className={`h-[1px] bg-slate-100 ${isSidebarCollapsed ? 'mx-1' : 'mx-2'}`}></div>

                    {/* Main Navigation Section */}
                    <div>
                        {!isSidebarCollapsed && (
                            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">
                                Navigation
                            </p>
                        )}
                        <div className="space-y-0.5">
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
                                        className={({ isActive }) => `relative flex items-center ${isSidebarCollapsed ? 'justify-center py-2 px-0' : 'px-2.5 py-1.5 gap-2.5'} rounded-xl transition-all duration-150 group select-none ${itemLocked ? 'opacity-40 cursor-not-allowed text-slate-400' : (isActive ? 'bg-primary/10 text-primary font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70')}`}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                                )}
                                                <span className={`text-base shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                                    {item.icon}
                                                </span>
                                                {!isSidebarCollapsed && (
                                                    <div className="flex items-center justify-between w-full min-w-0">
                                                        <span className="text-[13px] tracking-tight truncate">
                                                            {item.label}
                                                        </span>
                                                        {itemLocked && <IoLockClosedOutline className="text-slate-400 text-xs shrink-0 ml-auto" />}
                                                    </div>
                                                )}
                                                {isSidebarCollapsed && (
                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                                        {item.label}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}

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
                                    className={({ isActive }) => `relative flex items-center ${isSidebarCollapsed ? 'justify-center py-2 px-0' : 'px-2.5 py-1.5 gap-2.5'} rounded-xl transition-all duration-150 group select-none ${noBranchLocked ? 'opacity-40 cursor-not-allowed text-slate-400' : (isActive ? 'bg-primary/10 text-primary font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70')}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                            )}
                                            <span className={`text-base shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                                {pricingItem.icon}
                                            </span>
                                            {!isSidebarCollapsed && (
                                                <div className="flex items-center justify-between w-full min-w-0">
                                                    <span className="text-[13px] tracking-tight truncate">
                                                        {pricingItem.label}
                                                    </span>
                                                    {noBranchLocked && <IoLockClosedOutline className="text-slate-400 text-xs shrink-0 ml-auto" />}
                                                </div>
                                            )}
                                            {isSidebarCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                                    {pricingItem.label}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </div>
                    </div>

                    {/* Studio Section (Only visible for Admin) */}
                    {isAdmin && (
                        <div className="border-t border-slate-100 pt-2">
                            <button
                                type="button"
                                title={isSidebarCollapsed ? "Studio" : undefined}
                                onClick={() => setIsDsaOpen(prev => !prev)}
                                className={`w-full relative flex items-center ${isSidebarCollapsed ? 'justify-center py-2 px-0' : 'px-2.5 py-1.5 gap-2.5'} rounded-xl transition-all duration-150 group select-none text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 cursor-pointer ${location.pathname.startsWith('/dsa-management') ? 'bg-primary/10 text-primary font-bold' : ''}`}
                            >
                                {location.pathname.startsWith('/dsa-management') && (
                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                )}
                                <span className={`text-base shrink-0 transition-colors ${location.pathname.startsWith('/dsa-management') ? 'text-primary' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                    <IoSparklesOutline />
                                </span>
                                {!isSidebarCollapsed && (
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <span className="text-[13px] tracking-tight truncate">
                                            Studio
                                        </span>
                                        <IoChevronDownOutline className={`text-slate-400 text-xs shrink-0 ml-auto transition-transform duration-200 ${isDsaOpen ? 'rotate-180 text-primary' : ''}`} />
                                    </div>
                                )}
                                {isSidebarCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                        Studio
                                    </div>
                                )}
                            </button>

                            {/* Collapsible Sub-routes */}
                            <AnimatePresence initial={false}>
                                {(isDsaOpen || isSidebarCollapsed) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className={`overflow-hidden space-y-0.5 mt-0.5 ${!isSidebarCollapsed ? 'pl-3.5 border-l border-slate-200/60 ml-4' : ''}`}
                                    >
                                        {dsaSubRoutes.map((dsaItem, idx) => (
                                            <NavLink
                                                key={idx}
                                                to={noBranchLocked ? '#' : dsaItem.path}
                                                title={isSidebarCollapsed ? dsaItem.label : undefined}
                                                onClick={(e) => {
                                                    if (noBranchLocked) {
                                                        e.preventDefault();
                                                        toast.error("Please select a Module to enter the workspace!");
                                                        return;
                                                    }
                                                    if (isRevisionLocked) {
                                                        e.preventDefault();
                                                        toast.error("Complete your Daily Revision first!");
                                                        return;
                                                    }
                                                    if (setIsOpen) setIsOpen(false);
                                                }}
                                                className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center py-1.5 px-0' : 'px-2 py-1 gap-2'} rounded-lg transition-all duration-150 group relative ${noBranchLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60')}`}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={`text-xs shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                            {dsaItem.icon}
                                                        </span>
                                                        {!isSidebarCollapsed && (
                                                            <span className="text-xs tracking-tight truncate">
                                                                {dsaItem.label}
                                                            </span>
                                                        )}
                                                        {isSidebarCollapsed && (
                                                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                                                {dsaItem.label}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Arenas Section */}
                    <div className="border-t border-slate-100 pt-2">
                        {!isSidebarCollapsed ? (
                            <div className="flex items-center justify-between px-2 mb-1">
                                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                                    Arenas
                                </p>
                                {!hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase()) && (
                                    <button
                                        className={`w-5 h-5 rounded-md text-slate-400 hover:text-primary hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer ${noBranchLocked ? 'opacity-40 pointer-events-none' : ''}`}
                                        onClick={() => {
                                            if (noBranchLocked) return;
                                            navigate('/arenas/create-project');
                                            if (setIsOpen) setIsOpen(false);
                                        }}
                                        title="Create Arena"
                                    >
                                        <IoAdd size={14} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="h-[1px] bg-slate-100 my-2 mx-1"></div>
                        )}

                        <div className="space-y-0.5">
                            {noBranchLocked ? (
                                !isSidebarCollapsed && <p className="px-2 text-[11px] text-slate-400 italic">Select a module to view arenas</p>
                            ) : loading ? (
                                !isSidebarCollapsed && <p className="px-2 text-xs text-slate-400">Loading...</p>
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
                                            className={`relative group w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-1' : 'justify-between px-2.5 py-1'} cursor-pointer transition-all duration-150 rounded-lg ${noBranchLocked ? 'opacity-40 cursor-not-allowed' : (isActive ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60')}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all text-[10px] font-black uppercase ${isActive
                                                        ? 'bg-primary text-white shadow-xs shadow-primary/30'
                                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                                                    }`}>
                                                    {project.name ? project.name.charAt(0).toUpperCase() : 'A'}
                                                </span>
                                                {!isSidebarCollapsed && (
                                                    <span className={`text-[11.5px] tracking-tight truncate ${isActive ? 'font-bold text-primary' : 'group-hover:translate-x-0.5 transition-transform'}`}>
                                                        {project.name}
                                                    </span>
                                                )}
                                            </div>
                                            {!isSidebarCollapsed && noBranchLocked && <IoLockClosedOutline className="text-slate-400 text-xs shrink-0" />}
                                            {isSidebarCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                                    {project.name}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                !isSidebarCollapsed && <p className="px-2 text-xs text-slate-400 italic">No arenas found</p>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Bottom User Card & Settings */}
                <div className={`mt-auto border-t border-slate-100 bg-slate-50/50 ${isSidebarCollapsed ? 'p-2 space-y-1.5' : 'px-3 py-2.5 space-y-1.5'}`}>
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

                    {/* Integrated Sleek User Profile Footer */}
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center justify-between gap-2.5 pt-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                    {currentUser?.profileImage ? (
                                        <img src={currentUser.profileImage} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${currentUser ? (currentUser.firstName + "+" + (currentUser.lastName || "")) : "User"}&background=E34234&color=fff&bold=true`}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full border border-slate-200"
                                        />
                                    )}
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                                        {currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'User'}
                                    </p>
                                    <span className="text-xs font-medium text-slate-500 truncate leading-tight mt-0.5">
                                        {isAdmin ? "System Admin" : "Member"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                title="Logout Session"
                            >
                                <IoLogOutOutline size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative group flex justify-center pt-1" title={isSidebarCollapsed ? "Logout Session" : undefined}>
                            <button
                                onClick={handleLogout}
                                className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                title="Logout Session"
                            >
                                <IoLogOutOutline size={18} />
                            </button>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                                Logout Session
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

const MenuItem = ({ icon, label, path, isActive, onClick, isLocked, isCollapsed }) => {
    const navigate = useNavigate();
    return (
        <div className="relative group" title={isCollapsed ? label : undefined}>
            <button
                onClick={() => {
                    if (isLocked) {
                        toast.error("Complete your Daily Revision to unlock Settings!");
                        return;
                    }
                    navigate(path);
                    if (onClick) onClick();
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'px-2.5 py-1.5 gap-2.5'} rounded-xl transition-all duration-150 relative overflow-hidden font-medium ${isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                )}
                <span className={`text-base shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-700'}`}>
                    {React.cloneElement(icon, { size: 16 })}
                </span>
                {!isCollapsed && (
                    <div className="flex items-center justify-between w-full min-w-0">
                        <span className="text-[13.5px] font-semibold tracking-tight truncate text-slate-700">{label}</span>
                        {isLocked && <IoLockClosedOutline className="text-slate-400 text-xs shrink-0 ml-auto" />}
                    </div>
                )}
            </button>
            {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[9999] whitespace-nowrap shadow-slate-900/30">
                    {label}
                </div>
            )}
        </div>
    );
};

export default Sidebar;



