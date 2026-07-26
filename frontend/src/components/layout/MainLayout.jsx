import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalConsistencyModal from '../analytics/GlobalConsistencyModal';
import SarathiBot from '../sarathi/SarathiBot';
import { useSelector, useDispatch } from 'react-redux';
import { useLoading } from '../loader/LoaderContext';
import React, { useEffect, useState, useRef } from 'react';
import { BranchApi } from '../../services/api/Branch.api';
import { SubscriptionApi } from '../../services/api/Subscription.api';
import { setActiveBranch, updateCurrentUser, setDailyRevision } from '../../store/slices/storeSlice';
import { TaskApi } from '../../services/api/Task.api';
import { IoTimerOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const MainLayout = () => {
    const { activeBranch, currentUser, globalSettings, dailyRevision, isSidebarCollapsed } = useSelector((state) => state.store);
    const location = useLocation();
    const isLocked = dailyRevision && !dailyRevision.isCompleted;
    const allowedPaths = ['/revision', '/login', '/branch', '/pricing'];
    const isPathAllowed = allowedPaths.includes(location.pathname);
    const { handleLoading } = useLoading();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [timeRemaining, setTimeRemaining] = useState(currentUser?.invitationTimeRemaining || 0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const timerRef = useRef(null);
    const syncRef = useRef(null);

    // Fetch Daily Revision Status
    useEffect(() => {
        if (!currentUser || !activeBranch) return;
        const fetchDailyRevision = async () => {
            try {
                const tzOffset = new Date().getTimezoneOffset();
                const res = await TaskApi.getDailyRevision(tzOffset);
                dispatch(setDailyRevision(res.data?.data));
            } catch (err) {
                console.error("Failed to fetch daily revision in MainLayout:", err);
            }
        };
        fetchDailyRevision();
    }, [currentUser, activeBranch, dispatch]);

    // Daily Revision Lock Enforcement
    useEffect(() => {
        if (!currentUser || !activeBranch || !dailyRevision) return;

        const isLocked = !dailyRevision.isCompleted;
        const allowedPaths = ['/revision', '/login', '/branch', '/pricing'];

        if (isLocked && !allowedPaths.includes(location.pathname)) {
            toast.error("Complete your Daily Revision to unlock the application!");
            navigate('/revision', { replace: true });
        }
    }, [dailyRevision, location.pathname, navigate, currentUser, activeBranch]);

    // Auto-clear loader and close sidebar on page transitions to prevent "stuck" states
    useEffect(() => {
        handleLoading(false);
        setSidebarOpen(false);
    }, [location.pathname]);

    // Subscription Gate & Redirect Logic
    useEffect(() => {
        if (!currentUser) return;

        const isPricingPage = location.pathname === '/pricing';
        const isPaid = currentUser.subscriptionType === 'paid';
        const hasTime = (currentUser.invitationTimeRemaining || 0) > 0;
        const isAdmin = currentUser.email === "balajiaadi2000@gmail.com";

        if (!isPaid && !hasTime && !isPricingPage && !isAdmin) {
            navigate('/pricing', { replace: true });
        }
    }, [currentUser, location.pathname, navigate]);

    // Invitation Timer Logic
    useEffect(() => {
        if (currentUser?.subscriptionType !== 'paid' && (currentUser?.invitationTimeRemaining || 0) > 0) {
            setTimeRemaining(currentUser.invitationTimeRemaining);
            
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        navigate('/pricing', { replace: true });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Periodically sync time with server (every 30s)
            syncRef.current = setInterval(async () => {
                try {
                    // Get latest time from state
                    setTimeRemaining(current => {
                        SubscriptionApi.syncTime(current);
                        return current;
                    });
                } catch (e) { console.error("Sync failed", e); }
            }, 30000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (syncRef.current) clearInterval(syncRef.current);
        };
    }, [currentUser?.subscriptionType, currentUser?.invitationTimeRemaining, navigate]);

    useEffect(() => {
        if (!activeBranch && !['/branch', '/pricing', '/login'].includes(location.pathname)) {
            navigate('/branch', { replace: true });
        }
    }, [activeBranch, location.pathname, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex h-full w-full bg-bgLight font-sans text-textMain overflow-hidden">
            {activeBranch && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}
            
            {/* Backdrop overlay for mobile */}
            {activeBranch && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <div className={`flex-1 ${activeBranch ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72') : ''} flex flex-col h-full overflow-hidden relative transition-all duration-300`}>
                {activeBranch && <Header toggleSidebar={() => setSidebarOpen(prev => !prev)} />}
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    {isLocked && !isPathAllowed ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in duration-300">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-primary mb-4 border border-rose-100 shadow-sm animate-bounce">
                                <span className="text-3xl">🔒</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Access Locked</h2>
                            <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                                Complete your Daily Revision Protocol to unlock this page and all other features of Sarthi.
                            </p>
                            <button
                                onClick={() => navigate('/revision')}
                                className="mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-primary/20"
                            >
                                Go to Revision
                            </button>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>

                {/* Invitation Timer Sticky UI */}
                {globalSettings?.subscriptionType === 'paid' && currentUser?.subscriptionType !== 'paid' && timeRemaining > 0 && location.pathname !== '/pricing' && currentUser?.email !== "balajiaadi2000@gmail.com" && (
                    <div className="fixed bottom-8 right-8 z-[90] flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${timeRemaining < 60 ? 'bg-rose-500 animate-pulse' : 'bg-primary'} text-white`}>
                            <IoTimerOutline size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invitation Access</p>
                            <p className={`text-xl font-black italic tracking-tight ${timeRemaining < 60 ? 'text-rose-500' : 'text-white'}`}>
                                {formatTime(timeRemaining)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Modals */}
            <GlobalConsistencyModal />
            <SarathiBot />
        </div>
    );
};

export default MainLayout;
