import React, { useEffect, useState } from 'react';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import ConsistencyCalendar from './ConsistencyCalendar';
import { IoFlame, IoCalendarOutline, IoCheckmarkCircle } from 'react-icons/io5';

const ArenaConsistencyView = ({ projectId, projectName }) => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchStats();
        }
    }, [projectId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await AnalyticsApi.getProjectHealth({ projectId, period: 'daily' });
            setStats(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch arena consistency stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-3xl shadow-2xl text-white border border-white/5 relative overflow-hidden">
            {/* Header section */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <IoFlame size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            {projectName || 'Arena'} Consistency Map
                        </h2>
                        <p className="text-slate-400 text-xs font-semibold">Track active focus, task completion, & momentum in this Arena</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Arena Performance Map...</p>
                </div>
            ) : (
                <div className="w-full max-w-xl mx-auto">
                    <ConsistencyCalendar stats={stats} isEmbedded projectId={projectId} projectName={projectName} />
                </div>
            )}
        </div>
    );
};

export default ArenaConsistencyView;
