import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AnalyticsApi } from '../../services/api/Analytics.api';
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

const PerformanceDashboard = () => {
    const { currentUser } = useSelector((state) => state.store);
    const [period, setPeriod] = useState('weekly');
    const [activeTab, setActiveTab] = useState('personal');
    const [stats, setStats] = useState([]);
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberStats, setMemberStats] = useState([]);
    const [memberLoading, setMemberLoading] = useState(false);

    const userRole = (currentUser?.userRole?.name || currentUser?.userRoles?.[0]?.name || "").toLowerCase();
    const isAdminOrManager = ["admin", "project manager", "manager", "projectmanager"].includes(userRole);

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (activeTab === 'personal') {
                const res = await AnalyticsApi.getPersonalStats({ period });
                setStats(res.data?.data || []);
            } else {
                const res = await AnalyticsApi.getTeamStats({ period });
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
    }, [period, activeTab]);

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

    // Data for Personal Area Chart
    const chartData = useMemo(() => {
        return stats.map(s => ({
            name: moment(s.date).format(period === 'daily' ? 'HH:mm' : period === 'weekly' ? 'ddd' : 'MMM DD'),
            points: s.metrics.storyPointsDone || 0,
            hours: s.metrics.hoursLogged || 0,
            completed: s.metrics.tasksCompleted || 0
        }));
    }, [stats, period]);

    const aggregate = useMemo(() => stats.reduce((acc, curr) => {
        acc.hours += curr.metrics.hoursLogged || 0;
        acc.completed += curr.metrics.tasksCompleted || 0;
        acc.points += curr.metrics.storyPointsDone || 0;
        acc.onTime += curr.metrics.onTimeTasks || 0;
        acc.total += curr.metrics.totalTasksAssigned || 0;
        return acc;
    }, { hours: 0, completed: 0, points: 0, onTime: 0, total: 0 }), [stats]);

    const onTimeRate = aggregate.completed > 0 ? Math.round((aggregate.onTime / aggregate.completed) * 100) : 0;

    return (
        <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <IoBarChartOutline size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
                        <p className="text-slate-500 font-medium">Performance insights & productivity metrics</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {isAdminOrManager && (
                        <button 
                            onClick={async () => {
                                if (window.confirm("Resync all analytics data? This may take a moment.")) {
                                    setLoading(true);
                                    try {
                                        await AnalyticsApi.syncData();
                                        await fetchStats();
                                    } catch (e) {
                                        alert("Sync failed: " + e.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                        >
                            <IoTrendingUpOutline /> Sync Data
                        </button>
                    )}
                    {isAdminOrManager && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200/50">
                            {['personal', 'team'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-md font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p}
                            </button>
                        ))}
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
                            value={`${aggregate.hours.toFixed(1)}h`} 
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
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 h-[450px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black" style={{ color: '#1e293b' }}>Performance Trend</h3>
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
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                itemStyle={{ fontWeight: 800 }}
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
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                        <IoTrendingUpOutline size={40} className="text-slate-300 mb-3" />
                                        <p className="text-sm font-bold text-slate-400">No activity data for this period</p>
                                    </div>
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
                             <ConsistencyCalendar stats={stats} />
                         </div>
                         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                             <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Recent Milestone Impact</h3>
                             <div className="space-y-4">
                                 {stats.slice(0, 3).map((s, idx) => (
                                     <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md">
                                         <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                 <IoCheckmarkDoneCircleOutline size={20} />
                                             </div>
                                             <div>
                                                 <p className="font-black text-slate-800 text-sm italic">{moment(s.date).format('MMMM DD, YYYY')}</p>
                                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.metrics.tasksCompleted} Tasks Resolved</p>
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
                                 {stats.length === 0 && (
                                     <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                         <p className="text-xs font-black uppercase tracking-widest italic">No recent activity found</p>
                                         <p className="text-[10px] mt-2 font-bold opacity-60">Click sync to populate your performance map</p>
                                     </div>
                                 )}
                             </div>
                         </div>
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
                                                    {stat.metrics.hoursLogged?.toFixed(1) || 0}h
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
                                                    ) : isOvertime ? (
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
