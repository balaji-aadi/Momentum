import React, { useState, useEffect } from 'react';
import { PamphletApi } from '../../services/api/Pamphlet.api';
import {
    IoBookOutline,
    IoCheckmarkCircle,
    IoSyncOutline,
    IoChevronDown,
    IoChevronUp,
    IoFlame,
    IoSparkles,
    IoFolderOpenOutline,
    IoRibbonOutline,
    IoSearchOutline,
    IoCloseCircle,
    IoLayersOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const DsaPamphletWidget = () => {
    // Open/Close toggle state with localStorage persistence
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('dsa_pamphlet_collapsed') === 'true';
    });

    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [pamphletData, setPamphletData] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPatternId, setExpandedPatternId] = useState(null);

    const fetchPamphlet = async () => {
        setLoading(true);
        try {
            const res = await PamphletApi.getDsaPamphlet();
            setPamphletData(res.data?.data || null);
        } catch (error) {
            console.error('Failed to fetch DSA Pamphlet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncNow = async () => {
        setSyncing(true);
        try {
            const res = await PamphletApi.syncDsaPamphlet();
            setPamphletData(res.data?.data || null);
        } catch (error) {
            console.error('Failed to sync DSA Pamphlet:', error);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchPamphlet();
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('dsa_pamphlet_collapsed', String(nextState));
    };

    const readinessPercent = pamphletData?.overallReadinessPercent || 0;
    const completedPatterns = pamphletData?.completedPatternsCount || 0;
    const totalPatterns = pamphletData?.totalPatternsCount || 0;
    const topicsList = pamphletData?.topics || [];
    const allPatterns = pamphletData?.patterns || [];

    // Filter patterns by topic and search
    const filteredPatterns = allPatterns.filter(p => {
        const matchesTopic = selectedTopic === 'All' || p.topic === selectedTopic;
        const matchesSearch = searchQuery.trim() === '' ||
            p.patternName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTopic && matchesSearch;
    });

    // Helper for readiness status badge
    const getReadinessLevel = (pct) => {
        if (pct >= 85) return { label: 'FAANG Master 👑', color: 'from-amber-400 to-yellow-500', textColor: 'text-amber-500' };
        if (pct >= 60) return { label: 'Interview Ready 🔥', color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-500' };
        if (pct >= 30) return { label: 'Solid Foundation ⚡', color: 'from-blue-400 to-indigo-500', textColor: 'text-indigo-500' };
        return { label: 'Getting Started 🚀', color: 'from-rose-400 to-vermilion-500', textColor: 'text-rose-500' };
    };

    const readinessInfo = getReadinessLevel(readinessPercent);

    return (
        <div className="w-full bg-white rounded-[2.2rem] border border-slate-200/80 shadow-xl shadow-slate-100/60 overflow-hidden mb-6 transition-all">
            {/* Top Widget Header Bar */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <IoBookOutline size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                FAANG DSA Interview Pamphlet
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider">
                                Pattern Roadmap
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-2">
                            <span>Auto-Synced across all DB Arenas (<span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/10">DSA</span>, <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/10">DSAphase2</span>)</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="text-slate-300 font-bold">Every 2 Days Cron</span>
                        </p>
                    </div>
                </div>

                {/* Header Action Controls */}
                <div className="flex items-center gap-3 z-10 self-start md:self-auto">
                    {/* Manual Sync Now Button */}
                    <button
                        onClick={handleSyncNow}
                        disabled={syncing || loading}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Sync live pattern progress across all DB arenas now"
                    >
                        <IoSyncOutline className={`${syncing ? 'animate-spin text-primary' : ''}`} size={16} />
                        <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>

                    {/* Expand/Collapse Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className="px-4 py-2 bg-primary hover:bg-vermilion-600 text-white active:scale-95 transition-all rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-primary/30 cursor-pointer"
                    >
                        <span>{isCollapsed ? 'Show Pamphlet' : 'Hide Pamphlet'}</span>
                        {isCollapsed ? <IoChevronDown size={16} /> : <IoChevronUp size={16} />}
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar (Always Visible even when collapsed) */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                {/* FAANG Readiness Percent Meter */}
                <div className="flex items-center gap-3.5">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0 shadow-sm bg-white rounded-full border border-slate-100 overflow-hidden p-0">
                        <svg viewBox="0 0 60 60" className="w-full h-full transform -rotate-90">
                            <circle
                                cx="30"
                                cy="30"
                                r="23"
                                stroke="#f1f5f9"
                                strokeWidth="4.5"
                                fill="transparent"
                            />
                            <circle
                                cx="30"
                                cy="30"
                                r="23"
                                stroke="#E34234"
                                strokeWidth="4.5"
                                fill="transparent"
                                strokeDasharray={144.5}
                                strokeDashoffset={144.5 - (144.5 * readinessPercent) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute text-sm font-black text-slate-900 tracking-tight">{readinessPercent}%</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">FAANG Readiness Score</span>
                        </div>
                        {/* Meter bar */}
                        <div className="w-48 sm:w-64 h-2.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                            <div
                                className="h-full bg-vermilion-500 transition-all duration-700 rounded-full"
                                style={{ width: `${readinessPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Pattern Checkmark Stats */}
                <div className="flex items-center gap-6 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                        <IoCheckmarkCircle className="text-emerald-500" size={20} />
                        <div>
                            <span className="font-black text-slate-900">{completedPatterns} / {totalPatterns}</span>
                            <span className="text-slate-400 font-medium ml-1">Patterns Mastered</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <IoLayersOutline className="text-indigo-500" size={18} />
                        <div>
                            <span className="font-black text-slate-900">{topicsList.length}</span>
                            <span className="text-slate-400 font-medium ml-1">Core Topics</span>
                        </div>
                    </div>

                    {pamphletData?.lastSyncedAt && (
                        <div className="text-[10px] text-slate-400 font-medium hidden lg:block">
                            Last Synced: <span className="font-bold text-slate-600">{moment(pamphletData.lastSyncedAt).fromNow()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* EXPANDABLE PAMPHLET CONTENT */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-5 sm:p-6"
                    >
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">
                                    Scanning All Database Arenas & Syncing FAANG Patterns...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Topic Pills & Search Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                                    {/* Topic Tabs */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full">
                                        <button
                                            onClick={() => setSelectedTopic('All')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${selectedTopic === 'All'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            All Patterns ({allPatterns.length})
                                        </button>
                                        {topicsList.map(t => (
                                            <button
                                                key={t.topicName}
                                                onClick={() => setSelectedTopic(t.topicName)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${selectedTopic === t.topicName
                                                    ? 'bg-primary text-white shadow-sm font-black'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                                                    }`}
                                            >
                                                <span>{t.topicName}</span>
                                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTopic === t.topicName ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                    {t.completedPatterns}/{t.totalPatterns}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative w-full md:w-64 shrink-0">
                                        <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search patterns..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 text-xs font-medium text-slate-800 transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <IoCloseCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Patterns Cards Grid */}
                                {filteredPatterns.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <p className="text-sm font-bold text-slate-600">No patterns found matching search</p>
                                        <p className="text-xs text-slate-400 mt-1">Try selecting a different topic or resetting search filter</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredPatterns.map((pattern) => {
                                            const progress = pattern.userProgress || {};
                                            const isDone = progress.isCompleted;
                                            const total = progress.totalAssigned || 0;
                                            const completed = progress.totalCompleted || 0;
                                            const matchedArenas = progress.matchedArenas || [];
                                            const isExpanded = expandedPatternId === pattern._id;

                                            return (
                                                <div
                                                    key={pattern._id}
                                                    className={`rounded-[1.6rem] p-5 transition-all border flex flex-col justify-between relative group ${isDone
                                                        ? 'bg-gradient-to-b from-emerald-50/40 to-white border-emerald-200/80 shadow-md shadow-emerald-50'
                                                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-lg'
                                                        }`}
                                                >
                                                    {/* Card Header: Topic & Weightage */}
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                                {pattern.topic}
                                                            </span>
                                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${pattern.importanceTier === 'Crucial'
                                                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                }`}>
                                                                {pattern.faangWeightage}
                                                            </span>
                                                        </div>

                                                        {/* Pattern Name & Auto Checkmark */}
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                                                {pattern.patternName}
                                                            </h3>

                                                            {/* Checkbox indicator */}
                                                            <div className="shrink-0 flex items-center justify-center pt-0.5">
                                                                {isDone ? (
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                                                                        <IoCheckmarkCircle size={22} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center" title="Complete all assigned problems in DB to auto checkmark">
                                                                        <span className="w-2 h-2 rounded-full bg-transparent"></span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Core Concept Summary */}
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-3">
                                                            {pattern.summary}
                                                        </p>
                                                    </div>

                                                    {/* Bottom Progress Bar & Arenas Expand Button */}
                                                    <div className="pt-3 border-t border-slate-100">
                                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                                                            <span>
                                                                {total > 0 ? (
                                                                    <span className={isDone ? 'text-emerald-600 font-black' : 'text-slate-700'}>
                                                                        {completed} / {total} Problems Done
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 italic font-medium">No tasks assigned in DB yet</span>
                                                                )}
                                                            </span>
                                                            <span className="font-black text-slate-800">
                                                                {total > 0 ? Math.round((completed / total) * 100) : 0}%
                                                            </span>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-primary'
                                                                    }`}
                                                                style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>

                                                        {/* Expand Matched Arenas Detail Toggle */}
                                                        {matchedArenas.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPatternId(isExpanded ? null : pattern._id)}
                                                                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl flex items-center justify-between transition-colors cursor-pointer gap-2"
                                                            >
                                                                <span className="flex items-center gap-2 min-w-0">
                                                                    <IoFolderOpenOutline size={16} className="text-slate-500 shrink-0" />
                                                                    <span className="truncate text-left">{matchedArenas.length} Arenas Tracked ({matchedArenas.map(a => a.arenaName).join(', ')})</span>
                                                                </span>
                                                                {isExpanded ? <IoChevronUp size={14} className="shrink-0 text-slate-400" /> : <IoChevronDown size={14} className="shrink-0 text-slate-400" />}
                                                            </button>
                                                        )}

                                                        {/* Accordion Detail: Matched Arenas & Problems */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="mt-3 pt-3 border-t border-slate-200/60 space-y-3 overflow-hidden text-left"
                                                                >
                                                                    {matchedArenas.map((arena) => (
                                                                        <div key={arena.arenaId} className="bg-slate-100/70 p-2.5 rounded-xl text-xs">
                                                                            <div className="flex items-center justify-between font-bold text-slate-800 mb-1.5">
                                                                                <span>{arena.arenaName}</span>
                                                                                <span className="text-[10px] px-2 py-0.5 bg-white rounded-md text-slate-600 border border-slate-200">
                                                                                    {arena.completed}/{arena.total} Done
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-1 pl-1">
                                                                                {(arena.problems || []).map((prob, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                                                                                        <span className="truncate pr-2">• {prob.taskName}</span>
                                                                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${prob.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                                                            }`}>
                                                                                            {prob.status}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DsaPamphletWidget;
