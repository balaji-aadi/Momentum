import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setShowConsistencyModal } from '../../store/slices/storeSlice';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import ConsistencyCalendar from './ConsistencyCalendar';
import { IoChevronForward } from 'react-icons/io5';

const GlobalConsistencyModal = () => {
    const dispatch = useDispatch();
    const { showConsistencyModal, currentUser } = useSelector((state) => state.store);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (showConsistencyModal && currentUser) {
            setLoading(true);
            fetchStats();
        }
    }, [showConsistencyModal, currentUser]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch personal stats for the consistency map (daily period)
            const res = await AnalyticsApi.getPersonalStats({ period: 'daily' });
            setStats(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch consistency stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (!showConsistencyModal) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={() => dispatch(setShowConsistencyModal(false))}
            ></div>
            <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-[#1a1a1a] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                    <div className="bg-indigo-600/10 p-8 text-white flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl shadow-xl backdrop-blur-md border border-indigo-500/30">
                                📅
                            </div>
                            <div>
                                <h2 className="text-xl font-black">My Consistency</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Personal Performance Map</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => dispatch(setShowConsistencyModal(false))}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                        >
                            <IoChevronForward size={24} className="rotate-180" />
                        </button>
                    </div>
                    <div className="p-8 min-h-[480px] flex flex-col justify-center items-center relative overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center gap-12 animate-in fade-in duration-700">
                                {/* Premium Momentum Loader */}
                                <div className="relative">
                                    {/* Rotating Outer Rings */}
                                    <div className="absolute inset-0 scale-150 opacity-20 border-t-2 border-indigo-500 rounded-full animate-spin duration-[3s]"></div>
                                    <div className="absolute inset-0 scale-125 opacity-10 border-r-2 border-emerald-500 rounded-full animate-spin duration-[5s] reverse"></div>
                                    
                                    {/* Central Pulsing Core */}
                                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 animate-pulse">
                                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {/* Glow Effect */}
                                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 -z-10 animate-pulse"></div>
                                    </div>
                                    
                                    {/* Particle Dots */}
                                    <div className="absolute -top-4 -right-4 w-3 h-3 bg-amber-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="absolute -bottom-2 -left-6 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-300"></div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <h3 className="text-white text-lg font-black uppercase tracking-[0.4em] translate-x-1">Momentum</h3>
                                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">Syncing Reliability Stats...</p>
                                </div>

                                {/* Background Ambient Light (Bottom) */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full"></div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 duration-500 flex-1 w-full">
                                <ConsistencyCalendar stats={stats} isEmbedded />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalConsistencyModal;
