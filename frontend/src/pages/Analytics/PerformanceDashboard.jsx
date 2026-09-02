import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnalyticsApi } from '../../services/api/Analytics.api';
import { TaskApi } from '../../services/api/Task.api';
import {
    IoTimeOutline,
    IoCheckmarkDoneCircleOutline,
    IoTrendingUpOutline,
    IoAlertCircleOutline,
    IoBarChartOutline,
    IoFlame
} from 'react-icons/io5';
import moment from 'moment';
import ConsistencyCalendar from '../../components/analytics/ConsistencyCalendar';
import AllArenasConsistency from '../../components/analytics/AllArenasConsistency';
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
import { IoCalendarOutline, IoFlaskOutline } from 'react-icons/io5';
import DsaPamphletWidget from '../../components/analytics/DsaPamphletWidget';

const PerformanceDashboard = () => {
    const { currentUser, activeBranch } = useSelector((state) => state.store);
    const navigate = useNavigate();
    const [period, setPeriod] = useState('weekly');
    const [stats, setStats] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dailyStats, setDailyStats] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
    const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));
    const [customStart, setCustomStart] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    const [customEnd, setCustomEnd] = useState(moment().format('YYYY-MM-DD'));
    const [chartView, setChartView] = useState('trend'); // 'trend' or 'weekly'

    const userRole = (currentUser?.userRole?.name || currentUser?.userRoles?.[0]?.name || "").toLowerCase();
    const isAdminOrManager = ["admin", "project manager", "manager", "projectmanager"].includes(userRole);

    const fetchStats = async () => {
        setLoading(true);
        try {
            let params = { period };

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

            const res = await AnalyticsApi.getPersonalStats(params);
            setStats(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTasks = async () => {
        try {
            const res = await TaskApi.getAllTasks({});
            setAllTasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch all tasks for metrics", error);
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

    const isDsaModule = useMemo(() => {
        if (!activeBranch) return false;
        const name = (activeBranch.name || '').toLowerCase();
        const slug = (activeBranch.slug || '').toLowerCase();
        const key = (activeBranch.key || '').toUpperCase();
        return slug.includes('dsa') || name.includes('data structure') || name.includes('dsa') || key === 'DSA';
    }, [activeBranch]);

    useEffect(() => {
        setStats([]);
        setAllTasks([]);
        setDailyStats([]);
    }, [activeBranch?._id || activeBranch]);

    useEffect(() => {
        if (activeBranch) {
            fetchStats();
            fetchAllTasks();
        }
    }, [period, selectedDate, selectedMonth, selectedWeekIndex, selectedYear, customStart, customEnd, activeBranch]);

    useEffect(() => {
        if (activeBranch) {
            fetchDailyStats();
        }
    }, [activeBranch]);

    const getWeeksInMonth = (monthStr) => {
        const weeks = [];
        const startOfMonth = moment(monthStr).startOf('month');
        const endOfMonth = moment(monthStr).endOf('month');

        let current = moment(startOfMonth).startOf('isoWeek');

        while (current.isBefore(endOfMonth)) {
            const weekStart = moment(current).startOf('isoWeek');
            const weekEnd = moment(current).endOf('isoWeek');

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

    useEffect(() => {
        if (period === 'weekly') {
            const weeks = getWeeksInMonth(selectedMonth);
            const today = moment();
            const currentWeekIdx = weeks.findIndex(w => today.isBetween(w.start, w.end, null, '[]'));
            setSelectedWeekIndex(currentWeekIdx !== -1 ? currentWeekIdx : 0);
        }
    }, [selectedMonth, period]);

    const currentPeriodRange = useMemo(() => {
        if (period === 'daily') {
            return {
                start: moment.utc(selectedDate).startOf('day'),
                end: moment.utc(selectedDate).endOf('day')
            };
        } else if (period === 'weekly') {
            const weeks = getWeeksInMonth(selectedMonth);
            const targetWeek = weeks[selectedWeekIndex] || weeks[0];
            if (targetWeek) {
                return {
                    start: moment.utc(targetWeek.start).startOf('day'),
                    end: moment.utc(targetWeek.end).endOf('day')
                };
            }
            return {
                start: moment.utc().startOf('isoWeek'),
                end: moment.utc().endOf('isoWeek')
            };
        } else if (period === 'monthly') {
            return {
                start: moment.utc(selectedMonth).startOf('month'),
                end: moment.utc(selectedMonth).endOf('month')
            };
        } else if (period === 'yearly') {
            return {
                start: moment.utc(selectedYear, 'YYYY').startOf('year'),
                end: moment.utc(selectedYear, 'YYYY').endOf('year')
            };
        } else if (period === 'custom') {
            return {
                start: moment.utc(customStart).startOf('day'),
                end: moment.utc(customEnd).endOf('day')
            };
        }
        return { start: moment.utc().startOf('isoWeek'), end: moment.utc().endOf('isoWeek') };
    }, [period, selectedDate, selectedMonth, selectedWeekIndex, selectedYear, customStart, customEnd]);

    const periodStats = useMemo(() => {
        if (!stats || stats.length === 0) return [];
        return stats.filter(s => {
            const d = moment.utc(s.date);
            return d.isSameOrAfter(currentPeriodRange.start, 'day') && 
                   d.isSameOrBefore(currentPeriodRange.end, 'day') &&
                   !d.isAfter(moment.utc(), 'day');
        });
    }, [stats, currentPeriodRange]);

    // Data for Personal Performance Trend Chart
    const chartData = useMemo(() => {
        if (period === 'weekly') {
            const days = [];
            let curr = currentPeriodRange.start.clone();
            while (curr.isSameOrBefore(currentPeriodRange.end, 'day')) {
                if (!curr.isAfter(moment.utc(), 'day')) {
                    const dStr = curr.format('YYYY-MM-DD');
                    const match = stats.find(s => moment.utc(s.date).format('YYYY-MM-DD') === dStr);
                    days.push({
                        name: curr.format('ddd DD'),
                        fullDate: curr.format('MMM DD, YYYY'),
                        points: match?.metrics?.storyPointsDone || (match?.metrics?.tasksCompleted ? match.metrics.tasksCompleted * 3 : 0),
                        hours: Number((match?.metrics?.hoursLogged || 0).toFixed(2)),
                        completed: match?.metrics?.tasksCompleted || 0
                    });
                }
                curr.add(1, 'day');
            }
            return days;
        }

        if (period === 'daily') {
            const days = [];
            let curr = moment.utc(selectedDate).subtract(6, 'days');
            const end = moment.utc(selectedDate);
            while (curr.isSameOrBefore(end, 'day')) {
                if (!curr.isAfter(moment.utc(), 'day')) {
                    const dStr = curr.format('YYYY-MM-DD');
                    const match = stats.find(s => moment.utc(s.date).format('YYYY-MM-DD') === dStr);
                    days.push({
                        name: curr.format('MMM DD'),
                        fullDate: curr.format('MMM DD, YYYY'),
                        points: match?.metrics?.storyPointsDone || (match?.metrics?.tasksCompleted ? match.metrics.tasksCompleted * 3 : 0),
                        hours: Number((match?.metrics?.hoursLogged || 0).toFixed(2)),
                        completed: match?.metrics?.tasksCompleted || 0
                    });
                }
                curr.add(1, 'day');
            }
            return days;
        }

        if (period === 'monthly' && chartView === 'weekly' && stats.length > 0) {
            const weeks = {};
            periodStats.forEach(s => {
                const weekNum = moment.utc(s.date).isoWeek();
                if (!weeks[weekNum]) {
                    weeks[weekNum] = {
                        name: `Week ${weekNum}`,
                        points: 0,
                        hours: 0,
                        completed: 0,
                        date: s.date
                    };
                }
                weeks[weekNum].points += s.metrics?.storyPointsDone || (s.metrics?.tasksCompleted ? s.metrics.tasksCompleted * 3 : 0);
                weeks[weekNum].hours += s.metrics?.hoursLogged || 0;
                weeks[weekNum].completed += s.metrics?.tasksCompleted || 0;
            });

            return Object.values(weeks)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(w => ({
                    ...w,
                    hours: Number(w.hours.toFixed(2))
                }));
        }

        return periodStats
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(s => ({
                name: moment.utc(s.date).format(period === 'yearly' ? 'MMM' : 'MMM DD'),
                fullDate: moment.utc(s.date).format('MMM DD, YYYY'),
                points: s.metrics?.storyPointsDone || (s.metrics?.tasksCompleted ? s.metrics.tasksCompleted * 3 : 0),
                hours: Number((s.metrics?.hoursLogged || 0).toFixed(2)),
                completed: s.metrics?.tasksCompleted || 0
            }));
    }, [stats, periodStats, period, currentPeriodRange, selectedDate, chartView]);

    const aggregate = useMemo(() => {
        return periodStats.reduce((acc, curr) => {
            acc.hours += curr.metrics?.hoursLogged || 0;
            acc.completed += curr.metrics?.tasksCompleted || 0;
            acc.points += curr.metrics?.storyPointsDone || 0;
            acc.onTime += curr.metrics?.onTimeTasks || 0;
            acc.total += curr.metrics?.totalTasksAssigned || 0;
            acc.backlogCompleted += curr.metrics?.backlogTasksCompleted || 0;
            return acc;
        }, { hours: 0, completed: 0, points: 0, onTime: 0, total: 0, backlogCompleted: 0 });
    }, [periodStats]);

    // User-specific task filtering for logged-in user personal metrics
    const userTasks = useMemo(() => {
        if (!allTasks || allTasks.length === 0) return [];
        if (!currentUser?._id) return allTasks;
        const uid = currentUser._id.toString();
        return allTasks.filter(t => {
            const assigneeId = typeof t.assignee === 'object' ? t.assignee?._id?.toString() : t.assignee?.toString();
            const createdById = typeof t.createdBy === 'object' ? t.createdBy?._id?.toString() : t.createdBy?.toString();
            return assigneeId === uid || createdById === uid;
        });
    }, [allTasks, currentUser]);

    // Precise live metrics calculated directly from user's assigned/created tasks within the current period
    const userDoneTasks = useMemo(() => {
        return userTasks.filter(t => {
            if (t.status !== 'done' && t.status !== 'completed') return false;
            let doneDate = t.createdAt;
            if (t.activityLogs && t.activityLogs.length > 0) {
                const doneLog = [...t.activityLogs].reverse().find(l => l.currentStatus === 'done');
                if (doneLog && doneLog.date) {
                    doneDate = doneLog.date;
                }
            }
            const d = moment.utc(doneDate);
            return d.isSameOrAfter(currentPeriodRange.start, 'day') && d.isSameOrBefore(currentPeriodRange.end, 'day');
        });
    }, [userTasks, currentPeriodRange]);

    const tasksCompletedCount = useMemo(() => {
        return Math.max(aggregate.completed || 0, userDoneTasks.length);
    }, [aggregate.completed, userDoneTasks.length]);

    const totalAssignedCount = useMemo(() => {
        return userTasks.length || aggregate.total || 0;
    }, [userTasks.length, aggregate.total]);

    const backlogCount = useMemo(() => {
        return userTasks.filter(t => {
            const st = (t.status || '').toLowerCase();
            return st === 'backlog';
        }).length;
    }, [userTasks]);

    const calculatedStoryPoints = useMemo(() => {
        if (aggregate.points > 0) return aggregate.points;
        return userDoneTasks.reduce((sum, t) => {
            if (t.storyPoints && t.storyPoints > 0) return sum + t.storyPoints;
            const priorityPoints = t.taskPriority === 'high' ? 5 : t.taskPriority === 'medium' ? 3 : 1;
            return sum + priorityPoints;
        }, 0);
    }, [aggregate.points, userDoneTasks]);

    const calculatedOnTimeData = useMemo(() => {
        if (userDoneTasks.length === 0) {
            const fallbackRate = aggregate.completed > 0 ? Math.round((aggregate.onTime / aggregate.completed) * 100) : 100;
            return { onTimeCount: aggregate.onTime || 0, rate: fallbackRate };
        }
        const onTimeTasks = userDoneTasks.filter(t => {
            if (!t.taskDueDate) return true;
            const completionDate = t.updatedAt || new Date();
            return !moment.utc(completionDate).isAfter(moment.utc(t.taskDueDate), 'day');
        });
        const rate = Math.round((onTimeTasks.length / userDoneTasks.length) * 100);
        return { onTimeCount: onTimeTasks.length, rate };
    }, [userDoneTasks, aggregate.onTime, aggregate.completed]);

    const efficiencyScore = useMemo(() => {
        const doneCount = userDoneTasks.length;
        const totalCount = userTasks.length;
        const completionRate = totalCount > 0 ? (doneCount / totalCount) * 100 : 100;
        return Math.min(100, Math.round((calculatedOnTimeData.rate * 0.7) + (completionRate * 0.3)));
    }, [userDoneTasks.length, userTasks.length, calculatedOnTimeData.rate]);

    const hasNoWork = useMemo(() => {
        return aggregate.hours === 0 && tasksCompletedCount === 0 && userDoneTasks.length === 0 && !loading;
    }, [aggregate.hours, tasksCompletedCount, userDoneTasks.length, loading]);

    return (
        <div className="px-1 py-4 sm:px-2 w-full max-w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4 min-w-fit">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                        <IoBarChartOutline size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Smart Dashboard</h1>
                        <p className="text-slate-500 font-medium whitespace-nowrap">Performance insights & productivity metrics</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-[1.5rem] border border-slate-200/50">
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                            {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {period === 'daily' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-primary" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-vermilion-400 uppercase leading-none mb-0.5">
                                        SELECT DATE
                                    </span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 p-0 h-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'weekly' && (
                            <>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                    <IoCalendarOutline className="text-primary" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-vermilion-400 uppercase leading-none mb-0.5">SELECT MONTH</span>
                                        <input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 cursor-pointer p-0 h-auto"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                    <IoFlaskOutline className="text-primary" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-vermilion-400 uppercase leading-none mb-0.5">SELECT WEEK</span>
                                        <select
                                            value={selectedWeekIndex}
                                            onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
                                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 p-0 h-auto cursor-pointer appearance-none"
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
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-primary" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-vermilion-400 uppercase leading-none mb-0.5">SELECT MONTH</span>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 cursor-pointer p-0 h-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'yearly' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <IoCalendarOutline className="text-primary" size={14} />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-vermilion-400 uppercase leading-none mb-0.5">SELECT YEAR</span>
                                    <input
                                        type="number"
                                        min="2020"
                                        max="2030"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 p-0 h-5 w-12"
                                    />
                                </div>
                            </div>
                        )}

                        {period === 'custom' && (
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-vermilion-100 shadow-sm animate-in slide-in-from-top-1 duration-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-vermilion-400 uppercase">From</span>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 p-0"
                                    />
                                </div>
                                <div className="w-px h-3 bg-vermilion-100"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-vermilion-400 uppercase">To</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 p-0"
                                    />
                                </div>
                            </div>
                        )}

                        {isAdminOrManager && (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Resync all analytics data? This may take a moment.")) {
                                        setLoading(true);
                                        try {
                                            await AnalyticsApi.syncData();
                                            await fetchStats();
                                            await fetchDailyStats();
                                            await fetchAllTasks();
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
                    </div>

                </div>
            </div>

            {/* FAANG DSA Interview Pamphlet & Multi-Arena Pattern Roadmap Widget (DSA Module Only) */}
            {isDsaModule && <DsaPamphletWidget />}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    icon={<IoTimeOutline size={32} />}
                    label="Hours Logged"
                    value={aggregate.hours ? `${Math.floor(aggregate.hours)}h ${Math.round((aggregate.hours % 1) * 60)}m` : "0h 0m"}
                    subtext="Total focus time"
                    color="indigo"
                />
                <StatCard
                    icon={<IoCheckmarkDoneCircleOutline size={32} />}
                    label="Tasks Completed"
                    value={tasksCompletedCount}
                    subtext={`${totalAssignedCount} assigned`}
                    color="emerald"
                />
                <StatCard
                    icon={<IoFlame size={32} />}
                    label="Backlog"
                    value={backlogCount}
                    subtext="Active & overdue backlog"
                    color="rose"
                />
                <StatCard
                    icon={<IoTrendingUpOutline size={32} />}
                    label="Story Points"
                    value={calculatedStoryPoints}
                    subtext="Complexity delivered"
                    color="blue"
                />
                <StatCard
                    icon={<IoCheckmarkDoneCircleOutline size={32} />}
                    label="On-Time Rate"
                    value={`${calculatedOnTimeData.rate}%`}
                    subtext="Punctuality percentage"
                    color="amber"
                />
            </div>

            {/* Performance Trend Chart & Workload Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Performance Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 min-h-[450px] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black" style={{ color: '#1e293b' }}>Performance Trend</h3>
                            {period === 'monthly' && (
                                <div className="flex bg-slate-100 p-1 rounded-xl mt-2 w-fit">
                                    <button
                                        onClick={() => setChartView('trend')}
                                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${chartView === 'trend' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Daily Trend
                                    </button>
                                    <button
                                        onClick={() => setChartView('weekly')}
                                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${chartView === 'weekly' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Weekly View
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5" style={{ color: '#E34234' }}><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#E34234' }}></span> POINTS</span>
                            <span className="flex items-center gap-1.5" style={{ color: '#FF7F50' }}><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#FFA590' }}></span> HOURS</span>
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
                                    <Bar dataKey="points" fill="#E34234" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="hours" fill="#FF7F50" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : stats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#E34234" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#E34234" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF7F50" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FF7F50" stopOpacity={0} />
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
                                        stroke="#E34234"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorPoints)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#FF7F50"
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

                {/* Workload Distribution Card */}
                <div
                    style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                    className="p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col justify-between overflow-hidden relative group"
                >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black mb-8 tracking-tight" style={{ color: '#ffffff' }}>Workload Distribution</h3>
                        <div className="space-y-6">
                            <DistributionItem
                                label="Completed"
                                value={aggregate.completed || allTasks.filter(t => t.status === 'done').length}
                                total={allTasks.length || aggregate.total || 1}
                                color="bg-emerald-400"
                                isDark
                            />
                            <DistributionItem
                                label="On-Time"
                                value={calculatedOnTimeData.onTimeCount}
                                total={aggregate.completed || allTasks.filter(t => t.status === 'done').length || 1}
                                color="bg-amber-400"
                                isDark
                            />
                            <DistributionItem
                                label="Story Points"
                                value={calculatedStoryPoints}
                                total={Math.max(calculatedStoryPoints + 5, 20)}
                                color="bg-primary"
                                isDark
                            />
                        </div>
                    </div>
                    <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🚀</div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#e2e8f0' }}>Efficiency Score</p>
                                <p className="text-lg font-black" style={{ color: '#ffffff' }}>{efficiencyScore}% Punctual & Productive</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consistency & Peak Activity Days Section */}
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
                            .map((s, idx) => {
                                const dayPoints = s.metrics.storyPointsDone || 0;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
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
                                            {dayPoints > 0 ? (
                                                <>
                                                    <p className="font-black text-primary">+{dayPoints} PTS</p>
                                                    <div className="h-1 w-20 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                        <div className="bg-primary h-full" style={{ width: `${Math.min(dayPoints * 10, 100)}%` }}></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100/60">
                                                    Active Day
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        {(stats.filter(s => (s.metrics.tasksCompleted > 0 || s.metrics.hoursLogged > 0)).length === 0) && (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                <p className="text-xs font-black uppercase tracking-widest italic opacity-60">Waiting for your next big win...</p>
                                <p className="text-[10px] mt-2 font-bold opacity-40 capitalize">Complete tasks to see your daily impact here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* All Arenas Consistency Section (Replaces Focus Mastery Logs) */}
            <AllArenasConsistency />
        </div>
    );
};

const StatCard = ({ icon, label, value, subtext, color, trend }) => {
    const colors = {
        indigo: 'text-primary bg-primary/10 border-primary/20',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden relative min-h-[150px] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border ${colors[color] || colors.indigo}`}>
                    <span className="text-lg">{icon}</span>
                </div>
                {trend && (
                    <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-current/10`}>
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 leading-none">{label}</p>
                <h2 className="text-2xl font-black text-slate-900 mb-1 truncate">{value}</h2>
                <p className="text-xs font-medium text-slate-400 truncate">{subtext}</p>
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
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
