import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import moment from 'moment';
import { IoFlash } from 'react-icons/io5';

const QUOTES = [
  "You must first become consistent before you can become exceptional. - Alex Hormozi",
  "You can beat most people at anything if you just stick with it for a year. - Alex Hormozi",
  "No one has ever regretted trying for a year. - Alex Hormozi",
  "The secret to getting what you want: doing lots of things you don't want first. - Alex Hormozi",
  "A focused fool can accomplish more than a distracted genius. - Alex Hormozi",
  "You don't become confident by shouting affirmations in the mirror, but by having a stack of undeniable proof that you are who you say you are. - Alex Hormozi",
  "I cannot lose if I do not quit. - Alex Hormozi",
  "To change your thoughts, change what you consume. - Alex Hormozi",
  "Volume x Time = Skill. - Alex Hormozi",
  "The market doesn't pay you for effort. It pays you for outcomes. - Alex Hormozi"
];

const GlobalTopBar = () => {
  const { currentUser } = useSelector((state) => state.store);
  const [stats, setStats] = useState([]);
  const [shuffledQuotes, setShuffledQuotes] = useState([...QUOTES]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  useEffect(() => {
    // Shuffle quotes for randomness
    setShuffledQuotes([...QUOTES].sort(() => 0.5 - Math.random()));
  }, []);

  useEffect(() => {
    // Cycle through quotes every 10 seconds
    const interval = setInterval(() => {
      setIsQuoteVisible(false); // trigger fade out
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setIsQuoteVisible(true); // trigger fade in
      }, 500); // Wait 500ms for text to disappear before switching
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const res = await AnalyticsApi.getPersonalStats({ period: 'daily' });
      setStats(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch consistency stats for TopBar", error);
    }
  };

  const currentStreak = useMemo(() => {
    if (!stats || stats.length === 0) return 0;
    
    // Create a map of date strings to active status
    const dateMap = {};
    stats.forEach(s => {
      const dateStr = moment(s.date).format('YYYY-MM-DD');
      const hasWork = (s.metrics?.tasksCompleted > 0) || (s.metrics?.hoursLogged > 0) || (s.metrics?.accountabilityLogs > 0);
      dateMap[dateStr] = hasWork;
    });

    let streak = 0;
    let checkDate = moment().startOf('day');
    
    // Allow today to be 0 without breaking streak if yesterday was active
    const todayStr = checkDate.format('YYYY-MM-DD');
    const yesterdayStr = moment(checkDate).subtract(1, 'days').format('YYYY-MM-DD');

    let startCountingFrom = checkDate;
    if (!dateMap[todayStr] && dateMap[yesterdayStr]) {
        startCountingFrom = moment(checkDate).subtract(1, 'days');
    }

    let currentCheck = startCountingFrom;
    for (let i = 0; i < 365; i++) { // cap check at 365 days
        const str = currentCheck.format('YYYY-MM-DD');
        if (dateMap[str]) {
            streak++;
            currentCheck.subtract(1, 'days');
        } else {
            break;
        }
    }

    return streak;
  }, [stats]);

  if (!currentUser) return null;

  return (
    <div className="w-full bg-[#111111] border-b border-white/5 h-10 flex items-center justify-between text-xs overflow-hidden relative z-[60] shrink-0 font-sans text-slate-300">
      
      {/* Centered Quote Section */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center h-full px-8">
          <div 
            className={`transition-all duration-500 ease-in-out transform flex items-center justify-center w-full
              ${isQuoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            <span className="font-medium text-slate-400 text-center truncate">
              <span className="text-primary font-bold mr-2">✦</span>
              {shuffledQuotes[currentQuoteIndex]}
            </span>
          </div>
      </div>

      {/* Streak Section */}
      <div className="flex items-center gap-2 h-full px-5 bg-gradient-to-r from-transparent via-[#1a1a1a] to-[#1a1a1a] shrink-0 border-l border-white/5 shadow-[-10px_0_15px_-5px_rgba(17,17,17,1)] relative z-10">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <IoFlash className="text-emerald-400" size={14} />
          </div>
          <div className="flex flex-col justify-center">
              <span className="font-black text-white text-[10px] leading-tight flex items-center gap-1.5">
                  {currentStreak} DAY STREAK
              </span>
              <span className="uppercase tracking-[0.2em] text-[7px] text-emerald-400/80 font-bold leading-tight">Consistency Focus</span>
          </div>
      </div>

    </div>
  );
};

export default GlobalTopBar;
