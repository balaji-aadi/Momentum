import React, { useState, useEffect } from 'react';
import { ProjectApi } from '../../services/api/Project.api';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import ConsistencyCalendar from './ConsistencyCalendar';
import { IoBriefcaseOutline, IoFlame, IoTimeOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const AllArenasConsistency = () => {
    const [projects, setProjects] = useState([]);
    const [projectStatsMap, setProjectStatsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedArenaId, setSelectedArenaId] = useState('all');

    useEffect(() => {
        const fetchAllArenasData = async () => {
            setLoading(true);
            try {
                const res = await ProjectApi.getAllProjects();
                const fetchedProjects = res.data?.data || [];
                setProjects(fetchedProjects);

                const statsPromises = fetchedProjects.map(async (project) => {
                    try {
                        const statsRes = await AnalyticsApi.getProjectHealth({ projectId: project._id, period: 'daily' });
                        return { projectId: project._id, stats: statsRes.data?.data || [] };
                    } catch (e) {
                        return { projectId: project._id, stats: [] };
                    }
                });

                const statsResults = await Promise.all(statsPromises);
                const statsMap = {};
                statsResults.forEach(item => {
                    statsMap[item.projectId] = item.stats;
                });
                setProjectStatsMap(statsMap);
            } catch (error) {
                console.error("Failed to fetch arenas consistency data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllArenasData();
    }, []);

    const displayedProjects = selectedArenaId === 'all' 
        ? projects 
        : projects.filter(p => p._id === selectedArenaId);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-100/50 mt-6 transition-all w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 bg-vermilion-50 rounded-xl flex items-center justify-center text-primary border border-vermilion-100">
                            <IoBriefcaseOutline size={18} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Arenas Consistency Heatmaps</h3>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-10">
                        Activity & momentum breakdown across all project arenas
                    </p>
                </div>

                {/* Arena Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none max-w-full">
                    <button
                        onClick={() => setSelectedArenaId('all')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                            selectedArenaId === 'all' 
                                ? 'bg-slate-900 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        All Arenas ({projects.length})
                    </button>
                    {projects.map(p => (
                        <button
                            key={p._id}
                            onClick={() => setSelectedArenaId(p._id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                selectedArenaId === p._id 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-100'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            <span>{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Arena Consistency Data...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-xs font-bold">No Arenas Available</p>
                    <p className="text-[9px] uppercase tracking-widest mt-1">Create an arena to start tracking consistency maps</p>
                </div>
            ) : (
                /* Compact Arenas Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {displayedProjects.map((project) => {
                            const pStats = projectStatsMap[project._id] || [];
                            const totalCompleted = pStats.reduce((acc, s) => acc + (s.metrics?.tasksCompleted || 0), 0);
                            const totalHours = pStats.reduce((acc, s) => acc + (s.metrics?.hoursLogged || 0), 0);
                            const totalPoints = pStats.reduce((acc, s) => acc + (s.metrics?.storyPointsDone || 0), 0);
                            const activeDays = pStats.filter(s => (s.metrics?.tasksCompleted || 0) > 0 || (s.metrics?.hoursLogged || 0) > 0).length;

                            return (
                                <motion.div
                                    key={project._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    className="bg-slate-900 text-white p-4 sm:p-5 rounded-[1.8rem] shadow-xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
                                >
                                    {/* Subtle Ambient Glow */}
                                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>

                                    {/* Card Top Row */}
                                    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10 relative z-10">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-primary border border-white/10 shrink-0">
                                                <IoFlame size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                                                    <span className="truncate">{project.name}</span>
                                                    {project.key && (
                                                        <span className="px-1.5 py-0.2 bg-primary/20 text-primary text-[8px] font-black uppercase tracking-wider rounded border border-primary/30 shrink-0">
                                                            {project.key}
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                                    {activeDays} Days · {totalCompleted} Tasks
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Badges */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                                                <IoTimeOutline className="text-slate-400" size={12} />
                                                <span className="text-[10px] font-black text-slate-200">{totalHours.toFixed(1)}h</span>
                                            </div>
                                            {totalPoints > 0 && (
                                                <div className="bg-primary/20 px-2 py-1 rounded-lg border border-primary/30 flex items-center gap-1">
                                                    <span className="text-[10px] font-black text-primary">+{totalPoints}p</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Embedded Consistency Calendar (Sleek Compact Size) */}
                                    <div className="relative z-10 w-full">
                                        <ConsistencyCalendar stats={pStats} isEmbedded projectId={project._id} projectName={project.name} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default AllArenasConsistency;
