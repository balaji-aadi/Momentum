import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoChatbubbleEllipsesOutline,
  IoClose,
  IoFlame,
  IoCalendarOutline,
  IoTrendingUpOutline,
  IoTimeOutline,
  IoArrowForward,
  IoShieldCheckmarkOutline,
  IoEyeOffOutline,
  IoBookOutline
} from 'react-icons/io5';
import moment from 'moment';
import toast from 'react-hot-toast';
import { getDailyShlok } from './gitaData';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import { FocusApi } from '../../services/api/Focus.api';
import { TaskApi } from '../../services/api/Task.api';

const SarathiBot = () => {
  const navigate = useNavigate();
  const { currentUser, dailyRevision } = useSelector((state) => state.store);
  const isRevisionLocked = dailyRevision && dailyRevision.isEligible === true && dailyRevision.questions?.length > 0 && !dailyRevision.isCompleted;
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [yesterdayHours, setYesterdayHours] = useState(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [pendingRevisions, setPendingRevisions] = useState(0);
  const [todayRevisions, setTodayRevisions] = useState(0);
  const [isShlokHidden, setIsShlokHidden] = useState(false);
  const [showNotificationBubble, setShowNotificationBubble] = useState(false);

  const todayStr = useMemo(() => moment().format('YYYY-MM-DD'), []);

  // Check if shlok was already dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('sarathi_shlok_dismissed_date');
    if (dismissedDate === todayStr) {
      setIsShlokHidden(true);
    }
  }, [todayStr]);

  const handleDismissShlok = () => {
    setIsShlokHidden(true);
    localStorage.setItem('sarathi_shlok_dismissed_date', todayStr);
  };

  const handleShowShlok = () => {
    setIsShlokHidden(false);
    localStorage.removeItem('sarathi_shlok_dismissed_date');
  };

  // Load stats when expanded or mounted
  const fetchStats = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch Yesterday's Study Hours using daily period (robust)
      const statsRes = await AnalyticsApi.getPersonalStats({ period: 'daily' });
      const statsList = statsRes.data?.data || [];
      const yesterdayStr = moment().subtract(1, 'days').format('YYYY-MM-DD');
      const yesterdayData = statsList.find(s => moment(s.date).format('YYYY-MM-DD') === yesterdayStr);
      setYesterdayHours(yesterdayData ? yesterdayData.metrics?.hoursLogged || 0 : 0);

      // 2. Fetch Today's Focus Minutes
      const focusRes = await FocusApi.getTodayStats();
      const focusMins = focusRes.data?.data?.totalMinutes ?? focusRes.data?.data?.totalDuration ?? 0;
      setTodayFocusMinutes(focusMins);

      // 3. Fetch Pending Revisions & Revisions Done Today
      const tzOffset = new Date().getTimezoneOffset();
      const revisionRes = await TaskApi.getRevisionStats(tzOffset);
      const revData = revisionRes.data?.data || {};
      setPendingRevisions(revData.overdueCount || 0);

      const count = revData.todayCount ?? (revData.revisionsByDate?.[todayStr]?.length || 0);
      setTodayRevisions(count);
    } catch (e) {
      console.error("SarathiBot failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch stats whenever modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchStats();
    }
  }, [isOpen, currentUser]);

  // Periodic Reminder logic: check every 5 minutes (300000ms)
  // If todayRevisions < 2, flash a notification bubble on the bot icon
  useEffect(() => {
    if (!currentUser) return;

    // Initial fetch
    fetchStats();

    const interval = setInterval(() => {
      fetchStats().then(() => {
        // If daily revision goal not met, show warning bubble
        if (todayRevisions < 2) {
          setShowNotificationBubble(true);
        }
      });
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentUser, todayRevisions]);

  // Determine user category based on yesterday's performance
  const stateCategory = useMemo(() => {
    if (yesterdayHours < 4) return 'slacking';
    if (yesterdayHours > 8) return 'overworked';
    return 'steady';
  }, [yesterdayHours]);

  const shlok = useMemo(() => {
    return getDailyShlok(stateCategory);
  }, [stateCategory]);

  const formatHours = (hours) => {
    if (!hours) return "0.0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[95] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-20 right-0 w-[380px] max-w-[calc(100vw-2rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-slate-800 dark:bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary border-2 border-white/20 shadow-md">
                  {/* Little Krishna circular 3D render avatar */}
                  <img
                    src="/little_krishna.jpeg"
                    alt="Sarathi"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase">Sarathi</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Your Divine Charioteer</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors relative z-10"
              >
                <IoClose size={16} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto custom-scrollbar">

              {/* Gita Shlok Card */}
              <AnimatePresence initial={false}>
                {!isShlokHidden ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-slate-50 dark:bg-slate-950/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group"
                  >
                    <div className="absolute top-3 right-3 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                      Gita Ch.{shlok.chapter} V.{shlok.verse}
                    </div>
                    <div className="text-xs font-black text-primary mb-2.5 tracking-wide italic whitespace-pre-line leading-relaxed">
                      {shlok.sanskrit}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      "{shlok.english}"
                    </div>

                    {/* Acknowledge & Hide button */}
                    <button
                      onClick={handleDismissShlok}
                      className="mt-3.5 w-full py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/20 text-slate-500 hover:text-primary text-[8px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <IoEyeOffOutline size={12} /> Acknowledge & Gain Space
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={handleShowShlok}
                    className="w-full py-2 bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <IoBookOutline size={12} /> Show Daily Gita Counsel
                  </button>
                )}
              </AnimatePresence>

              {/* Revision Goal Alert (Most Important: 2 Questions Daily) */}
              <div className={`p-4 rounded-3xl border transition-all ${todayRevisions >= 2
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30'
                  : 'bg-rose-50/60 border-rose-100/60 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/20'
                }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider">Revision Goal (Min 2 Daily)</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${todayRevisions >= 2 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'
                    }`}>
                    {todayRevisions >= 2 ? 'Goal Met' : 'Action Required'}
                  </span>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="text-lg mt-0.5">📚</div>
                  <div>
                    <p className="text-[11px] font-extrabold leading-relaxed">
                      {todayRevisions >= 2
                        ? `Wonderful! You have revised ${todayRevisions} problems today. Your mind is sharp and steadfast.`
                        : `Arjuna, revision is your focus anchor. You have only revised ${todayRevisions}/2 problems today. Complete at least 2 questions to solidify your wisdom.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Metrics Dashboard */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Stats Summary</h4>

                {/* Yesterday hours evaluate (Min 4h, Max 8h) */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-primary">
                      <IoCalendarOutline size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Yesterday Study</p>
                      <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                        {formatHours(yesterdayHours)} logged
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${yesterdayHours < 4
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : yesterdayHours > 8
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                    {yesterdayHours < 4 ? 'Below Goal' : yesterdayHours > 8 ? 'Overworked' : 'On Track'}
                  </span>
                </div>

                {/* Today Focus Status */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-emerald-500">
                      <IoTimeOutline size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Today's Focus</p>
                      <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                        {todayFocusMinutes} Minutes focused
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">Today</span>
                </div>

                {/* Pending Revisions count */}
                {pendingRevisions > 0 && (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-rose-500">
                        <IoTrendingUpOutline size={15} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Overdue Tasks</p>
                        <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                          {pendingRevisions} Revisions pending
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsOpen(false); navigate('/revision'); }}
                      className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-wider"
                    >
                      View Desk
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (isRevisionLocked) {
                    toast.error("Complete your Daily Revision to unlock Focus Session!");
                    navigate('/revision');
                    return;
                  }
                  navigate('/focus-timer');
                }}
                className={`flex-1 py-2.5 px-4 bg-primary text-white hover:bg-primaryHover text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 active:scale-95 ${isRevisionLocked ? 'opacity-50' : ''}`}
              >
                Focus Session <IoArrowForward size={12} />
              </button>
              <button
                onClick={() => { setIsOpen(false); navigate('/revision'); }}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                Revision Desk
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 3D Bot Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(!isOpen); setShowNotificationBubble(false); }}
        className={`w-16 h-16 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center relative group focus:outline-none border-2 ${todayRevisions < 2 ? 'border-primary animate-pulse' : 'border-emerald-500'
          }`}
      >
        {/* Layer 1: Spinning Glowing Sacred Geometry / Lotus Ring (Visual 3D element) */}
        <div className="absolute inset-[-4px] rounded-full border border-primary/30 opacity-60 animate-[spin_8s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite]" />
        <div className="absolute inset-[-2px] rounded-full border border-dashed border-primary/20 opacity-40 animate-[spin_12s_linear_infinite_reverse]" />

        {/* Layer 2: Glowing Aura on Hover */}
        <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 group-hover:blur-md transition-all duration-300" />

        {/* Layer 3: Cute Little Krishna 3D avatar round image */}
        <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden border-2 border-slate-800 shadow-md">
          <img
            src="/little_krishna.jpeg"
            alt="Krishna guide"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Small warning badge if today's revision is not met */}
        {(todayRevisions < 2 || showNotificationBubble) && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
            !
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default SarathiBot;
