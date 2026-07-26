import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    IoClose, 
    IoCheckmarkCircleOutline, 
    IoTimeOutline, 
    IoRepeatOutline, 
    IoCalendarOutline, 
    IoSparkles,
    IoCheckmarkDone,
    IoFlameOutline,
    IoDocumentTextOutline
} from 'react-icons/io5';
import moment from 'moment';
import { AnalyticsApi } from '../../services/api/Analytics.api';

const DayActivityModal = ({ isOpen, onClose, date, projectId, projectName }) => {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('solved'); // 'solved', 'revised', 'focus'

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !date) return;

        const fetchDayDetails = async () => {
            setLoading(true);
            try {
                const params = { date };
                if (projectId) {
                    params.projectId = projectId;
                }
                const res = await AnalyticsApi.getDayDetails(params);
                setDetails(res.data?.data || null);
            } catch (err) {
                console.error("Failed to fetch day details", err);
                setDetails(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDayDetails();
    }, [isOpen, date, projectId]);

    if (!isOpen) return null;

    const formattedDate = date ? moment(date).format('dddd, MMMM D, YYYY') : '';
    const completedTasks = details?.completedTasks || [];
    const revisedTasks = details?.revisedTasks || [];
    const focusSessions = details?.focusSessions || [];
    const summary = details?.summary || { tasksCompleted: 0, tasksRevised: 0, totalFocusHours: 0, accountabilityLogsCount: 0 };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/75 backdrop-blur-md transition-all z-[99991]"
                />

                {/* Modal Box */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl bg-[#181a24] border border-slate-700/80 rounded-[2.2rem] shadow-2xl shadow-black/80 overflow-hidden text-white z-[99999] flex flex-col max-h-[88vh]"
                >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-emerald-500/20 via-indigo-500/10 to-transparent blur-2xl pointer-events-none" />

                    {/* Header */}
                    <div className="p-5 sm:p-6 pb-4 border-b border-slate-700/80 flex items-center justify-between gap-4 relative z-10 shrink-0 bg-slate-900/60">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                                <IoCalendarOutline size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white">{formattedDate}</h2>
                                    {projectName && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                                            {projectName}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                    Daily Problem Solving & Focus Breakdown
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-all shrink-0 shadow-md"
                        >
                            <IoClose size={20} />
                        </button>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-[#161822]">
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3">
                                <div className="w-9 h-9 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                                    Fetching Activity Logs for {date}...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Metric Cards */}
                                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                                    <div className="bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-700/80 flex flex-col justify-between shadow-lg">
                                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Solved</span>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-lg sm:text-2xl font-black text-emerald-400">{summary.tasksCompleted}</span>
                                            <span className="text-[9px] font-bold text-slate-400">Tasks</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-700/80 flex flex-col justify-between shadow-lg">
                                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Revised</span>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-lg sm:text-2xl font-black text-amber-400">{summary.tasksRevised}</span>
                                            <span className="text-[9px] font-bold text-slate-400">Problems</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-700/80 flex flex-col justify-between shadow-lg">
                                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Focus</span>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-lg sm:text-2xl font-black text-indigo-400">{summary.totalFocusHours}h</span>
                                            <span className="text-[9px] font-bold text-slate-400">Logged</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Navigation Tabs */}
                                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setActiveTab('solved')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                            activeTab === 'solved'
                                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <IoCheckmarkDone size={14} />
                                        <span>Solved ({completedTasks.length})</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('revised')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                            activeTab === 'revised'
                                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <IoRepeatOutline size={14} />
                                        <span>Revised ({revisedTasks.length})</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('focus')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                            activeTab === 'focus'
                                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <IoTimeOutline size={14} />
                                        <span>Focus ({focusSessions.length})</span>
                                    </button>
                                </div>

                                {/* Tab Panels */}
                                {activeTab === 'solved' && (
                                    <div className="space-y-3">
                                        {completedTasks.length === 0 ? (
                                            <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 p-6 bg-white/[0.02]">
                                                <IoFlameOutline className="mx-auto text-slate-600 mb-2" size={28} />
                                                <p className="text-xs font-bold text-slate-400">No Problems Solved</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">No completed tasks recorded on this date</p>
                                            </div>
                                        ) : (
                                            completedTasks.map((t) => (
                                                <div 
                                                    key={t._id}
                                                    className="bg-white/5 hover:bg-white/[0.08] p-3.5 sm:p-4 rounded-2xl border border-white/5 transition-all flex items-start justify-between gap-3 group"
                                                >
                                                    <div className="space-y-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {t.taskId && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                                    {t.taskId}
                                                                </span>
                                                            )}
                                                            {t.projectName?.name && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-400 bg-white/5 border border-white/5">
                                                                    {t.projectName.name}
                                                                </span>
                                                            )}
                                                            {t.taskPriority && (
                                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${getPriorityColor(t.taskPriority)}`}>
                                                                    {t.taskPriority}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug">
                                                            {t.taskName}
                                                        </h4>
                                                        {t.completedAt && (
                                                            <p className="text-[9px] font-medium text-slate-500 flex items-center gap-1 pt-0.5">
                                                                <IoTimeOutline size={11} />
                                                                <span>Completed at {moment(t.completedAt).format('hh:mm A')}</span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    {t.storyPoints > 0 && (
                                                        <div className="shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1">
                                                            <IoSparkles size={11} />
                                                            <span>+{t.storyPoints} pts</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'revised' && (
                                    <div className="space-y-3">
                                        {revisedTasks.length === 0 ? (
                                            <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 p-6 bg-white/[0.02]">
                                                <IoRepeatOutline className="mx-auto text-slate-600 mb-2" size={28} />
                                                <p className="text-xs font-bold text-slate-400">No Revisions Logged</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">No problem revisions recorded on this date</p>
                                            </div>
                                        ) : (
                                            revisedTasks.map((t, idx) => (
                                                <div 
                                                    key={`${t._id}-${idx}`}
                                                    className="bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/5 space-y-2"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {t.taskId && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                                    {t.taskId}
                                                                </span>
                                                            )}
                                                            <h4 className="text-sm font-bold text-slate-200">{t.taskName}</h4>
                                                        </div>
                                                        <span className="text-[9px] font-medium text-slate-400">
                                                            {moment(t.revisionDate).format('hh:mm A')}
                                                        </span>
                                                    </div>
                                                    {t.notes && (
                                                        <p className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5 italic">
                                                            "{t.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'focus' && (
                                    <div className="space-y-3">
                                        {focusSessions.length === 0 ? (
                                            <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 p-6 bg-white/[0.02]">
                                                <IoTimeOutline className="mx-auto text-slate-600 mb-2" size={28} />
                                                <p className="text-xs font-bold text-slate-400">No Focus Sessions</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">No timer sessions logged on this date</p>
                                            </div>
                                        ) : (
                                            focusSessions.map((s) => (
                                                <div 
                                                    key={s._id}
                                                    className="bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3"
                                                >
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-sm font-bold text-slate-200">
                                                            {s.task?.taskName || 'Focus Timer Session'}
                                                        </h4>
                                                        {s.startTime && (
                                                            <p className="text-[9px] text-slate-400 font-medium">
                                                                Started at {moment(s.startTime).format('hh:mm A')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-black">
                                                        {s.durationMinutes} min ({s.durationHours}h)
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default DayActivityModal;
