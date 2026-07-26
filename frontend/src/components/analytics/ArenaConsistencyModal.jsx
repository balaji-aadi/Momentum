import React, { useEffect, useState } from 'react';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import ConsistencyCalendar from './ConsistencyCalendar';
import { IoChevronForward } from 'react-icons/io5';

const ArenaConsistencyModal = ({ isOpen, onClose, project }) => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && project) {
            fetchArenaStats();
        }
    }, [isOpen, project]);

    const fetchArenaStats = async () => {
        const projectId = project._id || project.id || project.value;
        if (!projectId) return;
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

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-[#1a1a1a] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                    {/* Header */}
                    <div className="bg-emerald-600/10 p-8 text-white flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl shadow-xl backdrop-blur-md border border-emerald-500/30">
                                ⚔️
                            </div>
                            <div>
                                <h2 className="text-xl font-black">{project.name || project.label || 'Arena'} Consistency</h2>
                                <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                                    Arena Performance Map • {project.key || 'ARENA'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                        >
                            <IoChevronForward size={24} className="rotate-180" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 min-h-[350px] flex flex-col justify-center items-center relative overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center gap-12 animate-in fade-in duration-700">
                                {/* Sarathi Loader */}
                                <div className="relative">
                                    <div className="absolute inset-0 scale-150 opacity-20 border-t-2 border-emerald-500 rounded-full animate-spin duration-[3s]"></div>
                                    <div className="absolute inset-0 scale-125 opacity-10 border-r-2 border-indigo-500 rounded-full animate-spin duration-[5s] reverse"></div>
                                    
                                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 animate-pulse">
                                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 -z-10 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <h3 className="text-white text-lg font-black uppercase tracking-[0.4em] translate-x-1">{project.name || project.label}</h3>
                                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">Syncing Arena Consistency...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 duration-500 w-full max-w-lg mx-auto">
                                <ConsistencyCalendar stats={stats} isEmbedded projectId={project._id || project.id || project.value} projectName={project.name || project.label} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArenaConsistencyModal;
