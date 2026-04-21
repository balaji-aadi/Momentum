import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import { FocusApi } from '../../services/api/Focus.api';
import { 
    IoTimeOutline, 
    IoCheckmarkDoneCircleOutline, 
    IoTrendingUpOutline, 
    IoAlertCircleOutline,
    IoPeopleOutline,
    IoBarChartOutline,
    IoChevronForward
} from 'react-icons/io5';
import moment from 'moment';
import ConsistencyCalendar from '../../components/analytics/ConsistencyCalendar';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import TrollingEmptyState from '../../components/analytics/TrollingEmptyState';
import { IoCalendarOutline, IoChevronDownOutline, IoFlaskOutline } from 'react-icons/io5';

const PerformanceDashboard = () => {
    const { currentUser } = useSelector((state) => state.store);
    const navigate = useNavigate();
    const [period, setPeriod] = useState('weekly');
    const [activeTab, setActiveTab] = useState('personal');
    const [stats, setStats] = useState([]);
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberStats, setMemberStats] = useState([]);
    const [memberLoading, setMemberLoading] = useState(false);
    const [dailyStats, setDailyStats] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [focusSessions, setFocusSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
    const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));
    const [customStart, setCustomStart] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    const [customEnd, setCustomEnd] = useState(moment().format('YYYY-MM-DD'));
    const [customRange, setCustomRange] = useState(null);
    const [chartView, setChartView] = useState('trend'); // 'trend' or 'weekly'

    const userRole = (currentUser?.userRole?.name || currentUser?.userRoles?.[0]?.name || "").toLowerCase();
    const isAdminOrManager = ["admin", "project manager", "manager", "projectmanager"].includes(userRole);

    const fetchStats = async () => {
        setLoading(true);
        try {
            let params = { period };
            
            // Advance Performance Calculator logic:
            if (period === 'daily') {
                params.period = 'daily';
                params.startDate = moment(selectedDate).subtract(6, 'days').startOf('day').toISOString();
                params.endDate = moment(selectedDate).endOf('day').toISOString();
            } else if (period === 'weekly') {
                params.period = 'daily';
                const weeks = getWeeksInMonth(selectedMonth);
                const targetWeek = weeks[selectedWeekIndex] || weeks[0];
                params.startDate = targetWeek.start.toISOString();
                params.endDate = targetWeek.end.toISOString();
            } else if (period === 'monthly') {
                params.period = 'daily';
                params.startDate = moment(selectedMonth).startOf('month').toISOString();
                params.endDate = moment(selectedMonth).endOf('month').toISOString();
            } else if (period === 'yearly') {
                params.period = 'monthly';
                params.startDate = moment(selectedYear, 'YYYY').startOf('year').toISOString();
                params.endDate = moment(selectedYear, 'YYYY').endOf('year').toISOString();
            } else if (period === 'custom') {
                params.period = 'daily';
                params.startDate = moment(customStart).startOf('day').toISOString();
                params.endDate = moment(customEnd).endOf('day').toISOString();
            }

            if (activeTab === 'personal') {
                const res = await AnalyticsApi.getPersonalStats(params);
                setStats(res.data?.data || []);
            } else {
                const res = await AnalyticsApi.getTeamStats(params);
                setTeamStats(res.data?.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Load focus sessions from database
        const fetchFocusLogs = async () => {
            try {
                const res = await FocusApi.getSessions();
                setFocusSessions(res.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch focus logs", error);
            }
        };
        fetchFocusLogs();
    }, [period, activeTab, selectedDate, selectedMonth, selectedWeekIndex, selectedYear, customStart, customEnd]);

    useEffect(() => {
        // Always fetch daily stats for the consistency calendar (matches topbar modal)
        fetchDailyStats();
    }, []);

    const fetchMemberStats = async (userId) => {
        setMemberLoading(true);
        try {
            const res = await AnalyticsApi.getMemberStats(userId, { period: 'daily' }); // Always get daily for the calendar
            setMemberStats(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch member stats", error);
        } finally {
            setMemberLoading(false);
        }
    };

    const fetchDailyStats = async () => {
        setDailyLoading(true);
        try {
            const res = await AnalyticsApi.getPersonalStats({ period: 'daily' });
            setDailyStats(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch daily stats for consistency calendar', error);
        } finally {
            setDailyLoading(false);
        }
    };

    const getWeeksInMonth = (monthStr) => {
        const weeks = [];
        const startOfMonth = moment(monthStr).startOf('month');
        const endOfMonth = moment(monthStr).endOf('month');
        
        let current = moment(startOfMonth).startOf('isoWeek');
        
        while (current.isBefore(endOfMonth)) {
            const weekStart = moment(current).startOf('isoWeek');
            const weekEnd = moment(current).endOf('isoWeek');
            
            // Only add week if it's not entirely in the future
            if (!weekStart.isAfter(moment(), 'day')) {
                weeks.push({
                    label: `Week ${weeks.length + 1}`,
                    display: `Week ${weeks.length + 1} (${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD')})`,
                    start: weekStart,
                    end: weekEnd
                });
            }
            current.add(1, 'week');
        }
        return weeks;
    };

    // Auto-select current week when month changes
    useEffect(() => {
        if (period === 'weekly') {
            const weeks = getWeeksInMonth(selectedMonth);
            const today = moment();
            const currentWeekIdx = weeks.findIndex(w => today.isBetween(w.start, w.end, null, '[]'));
            setSelectedWeekIndex(currentWeekIdx !== -1 ? currentWeekIdx : 0);
        }
    }, [selectedMonth, period]);

    // Data for Personal Area Chart
    const chartData = useMemo(() => {
        if (period === 'monthly' && stats.length > 0) {
            // Group daily stats into weeks for monthly view
            const weeks = {};
            stats.forEach(s => {
                const weekNum = moment(s.date).isoWeek();
                if (!weeks[weekNum]) {
                    weeks[weekNum] = {
                        name: `Week ${weekNum}`,
                        points: 0,
                        hours: 0,
                        completed: 0,
                        date: s.date // Keep for sorting
                    };
                }
                weeks[weekNum].points += s.metrics.storyPointsDone || 0;
                weeks[weekNum].hours += s.metrics.hoursLogged || 0;
                weeks[weekNum].completed += s.metrics.tasksCompleted || 0;
            });
            
            return Object.values(weeks)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .filter(w => !moment(w.date).isAfter(moment(), 'day')) // Hide future weeks
                .map(w => ({
                    ...w,
                    hours: Number(w.hours.toFixed(2))
                }));
        }

        return stats
            .filter(s => !moment(s.date).isAfter(moment(), 'day')) // Hide future dates
            .map(s => ({
                name: moment(s.date).format(period === 'daily' ? 'MMM DD' : period === 'weekly' ? 'ddd' : period === 'yearly' ? 'MMM' : 'MMM DD'),
                points: s.metrics.storyPointsDone || 0,
                hours: Number((s.metrics.hoursLogged || 0).toFixed(2)),
                completed: s.metrics.tasksCompleted || 0
            }));
    }, [stats, period]);

    const aggregate = useMemo(() => {
        let statsToAggregate = stats;
        
        // Detailed focusing for Daily period
        if (period === 'daily') {
            statsToAggregate = stats.filter(s => moment(s.date).format('YYYY-MM-DD') === moment(selectedDate).format('YYYY-MM-DD'));
        }

        // Always hide future stats from aggregate
        statsToAggregate = statsToAggregate.filter(s => !moment(s.date).isAfter(moment(), 'day'));

        return statsToAggregate.reduce((acc, curr) => {
            acc.hours += curr.metrics.hoursLogged || 0;
            acc.completed += curr.metrics.tasksCompleted || 0;
            acc.points += curr.metrics.storyPointsDone || 0;
            acc.onTime += curr.metrics.onTimeTasks || 0;
            acc.total += curr.metrics.totalTasksAssigned || 0;
            return acc;
        }, { hours: 0, completed: 0, points: 0, onTime: 0, total: 0 });
    }, [stats, period, selectedDate]);

    const hasNoWork = useMemo(() => {
        return aggregate.hours === 0 && aggregate.completed === 0 && !loading;
    }, [aggregate, loading]);

    const onTimeRate = aggregate.completed > 0 ? Math.round((aggregate.onTime / aggregate.completed) * 100) : 0;

    return (
        <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4 min-w-fit">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                        <IoBarChartOutline size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
                        <p className="text-slate-500 font-medium whitespace-nowrap">Performance insights & productivity metrics</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isAdminOrManager && (
                            <button 
                                onClick={async () => {
                                    if (window.confirm("Resync all analytics data? This may take a moment.")) {
                                        setLoading(true);
                                        try {
                                            await AnalyticsApi.syncData();
                                            await fetchStats();
                                            await fetchDailyStats();
                                        } catch (e) {
                                            alert("Sync failed: " + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                            >
                                <IoTrendingUpOutline /> Sync
                            </button>
                        )}
                        {isAdminOrManager && (
                            <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200/50">
                                {['personal', 'team'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-md font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-[1.5rem] border border-slate-200/50">
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                            {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {period === 'daily' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-indigo-600" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-0.5">
                                        SELECT DATE
                                    </span>
                                    <input 
                                        type="date" 
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 p-0 h-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'weekly' && (
                            <>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                    <IoCalendarOutline className="text-indigo-600" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-0.5">SELECT MONTH</span>
                                        <input 
                                            type="month" 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 cursor-pointer p-0 h-auto"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                    <IoFlaskOutline className="text-indigo-600" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-0.5">SELECT WEEK</span>
                                        <select 
                                            value={selectedWeekIndex}
                                            onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
                                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 p-0 h-auto cursor-pointer appearance-none"
                                        >
                                            {getWeeksInMonth(selectedMonth).map((w, idx) => (
                                                <option key={idx} value={idx}>{w.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {period === 'monthly' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-indigo-600" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-0.5">SELECT MONTH</span>
                                    <input 
                                        type="month" 
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 cursor-pointer p-0 h-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'yearly' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-indigo-600" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-0.5">SELECT YEAR</span>
                                    <input 
                                        type="number" 
                                        min="2020"
                                        max="2030"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 p-0 h-5 w-12"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'custom' && (
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase">From</span>
                                    <input 
                                        type="date" 
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 p-0"
                                    />
                                </div>
                                <div className="w-px h-3 bg-indigo-100"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase">To</span>
                                    <input 
                                        type="date" 
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-indigo-700 focus:ring-0 p-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeTab === 'personal' ? (
                <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            icon={<IoTimeOutline />} 
                            label="Hours Logged" 
                            value={aggregate.hours ? `${Math.floor(aggregate.hours)}h ${Math.round((aggregate.hours % 1) * 60)}m` : "0h 0m"} 
                            subtext="Total focus time"
                            color="indigo"
                        />
                        <StatCard 
                            icon={<IoCheckmarkDoneCircleOutline />} 
                            label="Tasks Completed" 
                            value={aggregate.completed} 
                            subtext={`${aggregate.total} assigned`}
                            color="emerald"
                        />
                        <StatCard 
                            icon={<IoTrendingUpOutline />} 
                            label="Story Points" 
                            value={aggregate.points} 
                            subtext="Complexity delivered"
                            color="blue"
                        />
                        <StatCard 
                            icon={<IoCheckmarkDoneCircleOutline />} 
                            label="On-Time Rate" 
                            value={`${onTimeRate}%`} 
                            subtext="Punctuality percentage"
                            color="amber"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Performance Chart */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 h-[450px] relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black" style={{ color: '#1e293b' }}>Performance Trend</h3>
                                    {period === 'monthly' && (
                                        <div className="flex bg-slate-100 p-1 rounded-xl mt-2 w-fit">
                                            <button 
                                                onClick={() => setChartView('trend')}
                                                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${chartView === 'trend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                Daily Trend
                                            </button>
                                            <button 
                                                onClick={() => setChartView('weekly')}
                                                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${chartView === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                Weekly View
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5" style={{ color: '#4f46e5' }}><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#6366f1' }}></span> POINTS</span>
                                    <span className="flex items-center gap-1.5" style={{ color: '#3b82f6' }}><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#93c5fd' }}></span> HOURS</span>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {loading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-3xl animate-pulse">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Data...</span>
                                    </div>
                                ) : hasNoWork ? (
                                    <TrollingEmptyState period={period} />
                                ) : (period === 'monthly' && chartView === 'weekly') ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '16px' }}
                                                itemStyle={{ fontWeight: 900, padding: '2px 0' }}
                                                formatter={(value, name) => [name === 'hours' ? `${Number(value).toFixed(2)} hrs` : value, name.toUpperCase()]}
                                            />
                                            <Bar dataKey="points" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                                            <Bar dataKey="hours" fill="#93c5fd" radius={[6, 6, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : stats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '16px' }}
                                                itemStyle={{ fontWeight: 900, padding: '2px 0' }}
                                                formatter={(value, name) => [name === 'hours' ? `${Number(value).toFixed(2)} hrs` : value, name.toUpperCase()]}
                                                labelStyle={{ color: '#64748b', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="points" 
                                                stroke="#4f46e5" 
                                                strokeWidth={4} 
                                                fillOpacity={1} 
                                                fill="url(#colorPoints)" 
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="hours" 
                                                stroke="#93c5fd" 
                                                strokeWidth={2} 
                                                fillOpacity={1} 
                                                fill="url(#colorHours)" 
                                                strokeDasharray="5 5"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <TrollingEmptyState period={period} />
                                )}
                            </div>
                        </div>

                        {/* Distribution Card - Fail-safe inline styles */}
                        <div 
                            style={{ backgroundColor: '#1e1b4b', color: '#ffffff' }}
                            className="p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200/50 flex flex-col justify-between overflow-hidden relative group"
                        >
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-8 tracking-tight" style={{ color: '#ffffff' }}>Workload Distribution</h3>
                                <div className="space-y-6">
                                    <DistributionItem label="Completed" value={aggregate.completed} total={aggregate.total} color="bg-emerald-400" isDark />
                                    <DistributionItem label="On-Time" value={aggregate.onTime} total={aggregate.completed} color="bg-amber-400" isDark />
                                    <DistributionItem label="Story Points" value={aggregate.points} total={aggregate.points + 10} color="bg-blue-400" isDark />
                                </div>
                            </div>
                            <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🚀</div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#c7d2fe' }}>Efficiency Score</p>
                                        <p className="text-lg font-black" style={{ color: '#ffffff' }}>{onTimeRate}% Punctual</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New Consistency & Detail Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         <div className="lg:col-span-1">
                             <ConsistencyCalendar stats={dailyStats.length ? dailyStats : stats} />
                         </div>
                         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                             <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Peak Activity Days</h3>
                             <div className="space-y-4">
                                 {stats
                                    .filter(s => (s.metrics.tasksCompleted > 0 || s.metrics.storyPointsDone > 0 || s.metrics.hoursLogged > 0))
                                    .sort((a, b) => (b.metrics.storyPointsDone - a.metrics.storyPointsDone) || (b.metrics.tasksCompleted - a.metrics.tasksCompleted))
                                    .slice(0, 3)
                                    .map((s, idx) => (
                                     <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md">
                                         <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                 <IoCheckmarkDoneCircleOutline size={20} />
                                             </div>
                                             <div>
                                                 <p className="font-black text-slate-800 text-sm italic">{moment(s.date).format('MMMM DD, YYYY')}</p>
                                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                     {s.metrics.tasksCompleted} Tasks · {s.metrics.hoursLogged.toFixed(1)} hrs
                                                 </p>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-black text-indigo-600">+{s.metrics.storyPointsDone} PTS</p>
                                             <div className="h-1 w-20 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                 <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(s.metrics.storyPointsDone * 10, 100)}%` }}></div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                                 {(stats.filter(s => (s.metrics.tasksCompleted > 0 || s.metrics.storyPointsDone > 0)).length === 0) && (
                                     <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                         <p className="text-xs font-black uppercase tracking-widest italic opacity-60">Waiting for your next big win...</p>
                                         <p className="text-[10px] mt-2 font-bold opacity-40 capitalize">Complete tasks to see your daily impact here</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>

                     {/* Focus Sessions Tracking Section */}
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 mt-8">
                         <div className="flex items-center justify-between mb-8">
                             <div>
                                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Focus Mastery Logs</h3>
                                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Self-directed study & deep work sessions</p>
                             </div>
                             <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                 <span className="text-indigo-600 font-black text-sm">
                                     Total: {Number(focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60).toFixed(1)} hrs focus
                                 </span>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {focusSessions.length > 0 ? focusSessions.slice(0, 6).map((session, idx) => (
                                 <div key={idx} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                                     <div className="flex items-center justify-between mb-3">
                                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                             {moment(session.date).format('MMM DD')}
                                         </span>
                                         <span className="text-xs font-black text-slate-800">{session.duration} MINS</span>
                                     </div>
                                     <div className="flex items-center gap-3 text-slate-400 mb-1">
                                         <IoTimeOutline size={14} />
                                         <div className="flex items-center gap-2 text-[11px] font-bold">
                                             <span>{moment(session.startTime).format("HH:mm")}</span>
                                             <span>→</span>
                                             <span>{moment(session.endTime).format("HH:mm")}</span>
                                         </div>
                                     </div>
                                     <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                         <div className="bg-gradient-to-r from-indigo-500 to-primary h-full" style={{ width: `${Math.min((session.duration / 60) * 100, 100)}%` }}></div>
                                     </div>
                                 </div>
                             )) : (
                                 <div className="lg:col-span-3 h-32 flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-100 rounded-3xl">
                                     <p className="text-sm font-bold">No focus sessions recorded today</p>
                                     <p className="text-[10px] font-black uppercase tracking-widest mt-1">Start your first session in Focus Mode</p>
                                 </div>
                             )}
                         </div>
                         {focusSessions.length > 6 && (
                             <button 
                                onClick={() => navigate('/focus-timer')}
                                className="w-full mt-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-all border border-indigo-100 hover:bg-indigo-50 rounded-xl italic"
                             >
                                 View full focus history →
                             </button>
                         )}
                     </div>
                </>
            ) : (
                /* Team / Manager View */
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <IoPeopleOutline size={28} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-800">{new Set(teamStats.map(s => s.entityId?._id)).size}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Members</p>
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <IoCheckmarkDoneCircleOutline size={28} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-800">
                                    {teamStats.reduce((acc, s) => acc + (s.metrics.tasksCompleted || 0), 0)}
                                </h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Completions</p>
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <IoAlertCircleOutline size={28} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-800">
                                    {teamStats.reduce((acc, s) => acc + (s.metrics.delayedTasks || 0), 0)}
                                </h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delayed Tasks</p>
                            </div>
                         </div>
                    </div>

                    {/* Team Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-800">Team Performance Overview</h3>
                            <button className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline">Export Report</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 italic">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Hours</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Points</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Punctuality</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                        <th className="px-8 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teamStats.length > 0 ? teamStats.map((stat, idx) => {
                                        const user = stat.entityId;
                                        const onTime = stat.metrics.tasksCompleted > 0 ? Math.round((stat.metrics.onTimeTasks / stat.metrics.tasksCompleted) * 100) : 0;
                                        
                                        return (
                                            <tr 
                                                key={stat._id} 
                                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    setSelectedMember(user);
                                                    fetchMemberStats(user._id);
                                                }}
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} 
                                                            className="w-10 h-10 rounded-full shadow-sm ring-2 ring-white"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{user?.firstName} {user?.lastName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Assigned: {stat.metrics.totalTasksAssigned}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center font-black text-slate-700 text-sm">
                                                    {stat.metrics.hoursLogged ? `${Math.floor(stat.metrics.hoursLogged)}h ${Math.round((stat.metrics.hoursLogged % 1) * 60)}m` : "0h 0m"}
                                                </td>
                                                <td className="px-4 py-5 text-center font-black text-indigo-600 text-sm">
                                                    {stat.metrics.storyPointsDone || 0}
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className="text-[10px] font-black text-slate-800">{onTime}%</span>
                                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${onTime > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${onTime}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    {stat.metrics.delayedTasks > 3 ? (
                                                        <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">At Risk</span>
                                                    ) : stat.metrics.hoursLogged > 8 ? (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">Overworked</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Healthy</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 group-hover:text-indigo-600">
                                                        <IoChevronForward size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-10 text-center text-slate-400 italic">No team activity data found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Performance Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)}></div>
                    <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl">
                             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                     <img 
                                        src={selectedMember.profileImage || `https://ui-avatars.com/api/?name=${selectedMember.firstName}+${selectedMember.lastName}&background=random`} 
                                        className="w-16 h-16 rounded-2xl shadow-xl ring-4 ring-white/20"
                                        alt=""
                                     />
                                     <div>
                                         <h2 className="text-2xl font-black">{selectedMember.firstName} {selectedMember.lastName}</h2>
                                         <p className="text-indigo-100/80 font-bold uppercase tracking-widest text-xs mt-1">Consistency Profile</p>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                 >
                                     <IoChevronForward size={24} className="rotate-180" />
                                 </button>
                             </div>
                             <div className="p-8">
                                 {memberLoading ? (
                                     <div className="h-64 flex items-center justify-center text-indigo-600">
                                         <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent"></div>
                                     </div>
                                 ) : (
                                     <ConsistencyCalendar stats={memberStats} />
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, subtext, color, trend }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };

    return (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative min-h-[180px] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border ${colors[color]}`}>
                    <span className="text-xl">{icon}</span>
                </div>
                {trend && (
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-current/10`}>
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 leading-none" style={{ color: '#94a3b8' }}>{label}</p>
                <h2 className="text-3xl font-black mb-2 truncate" style={{ color: '#1e293b' }}>{value}</h2>
                <p className="text-[10px] font-bold transition-colors uppercase tracking-widest truncate" style={{ color: '#94a3b8' }}>{subtext}</p>
            </div>
        </div>
    );
};

const DistributionItem = ({ label, value, total, color, isDark }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div 
                className={`flex justify-between text-[10px] font-black uppercase tracking-widest mb-2.5`}
                style={{ color: isDark ? '#e0e7ff' : '#64748b' }}
            >
                <span>{label}</span>
                <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{value} ({percentage}%)</span>
            </div>
            <div 
                className={`h-2.5 w-full rounded-full overflow-hidden shadow-inner`}
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}
            >
                <div 
                    className={`${color} h-full transition-all duration-1000 ease-out shadow-sm relative`} 
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
