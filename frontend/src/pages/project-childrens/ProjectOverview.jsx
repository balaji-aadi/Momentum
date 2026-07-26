import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { TaskApi } from '../../services/api/Task.api';
import moment from 'moment';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import ArenaConsistencyView from '../../components/analytics/ArenaConsistencyView';


const ProjectOverview = () => {
    const { projectId } = useParams();
    const { project } = useOutletContext(); // Get project from Layout
    const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, review: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverviewData = async () => {
            if (!projectId) return;
            setLoading(true);
            try {
                // 1. Project Details are now passed via Context (no need to fetch)

                // 2. Fetch Tasks for Stats
                const tRes = await TaskApi.getAllTasks({ filter: { projectName: projectId } });
                const tasks = tRes.data?.data || [];
                
                const stats = tasks.reduce((acc, task) => {
                    acc.total++;
                    if (task.status === 'done') acc.completed++;
                    else if (task.status === 'todo' || task.status === 'backlog') acc.pending++;
                    else if (task.status === 'inprogress') acc.inProgress++;
                    else if (task.status === 'review') acc.review++;
                    return acc;
                }, { total: 0, completed: 0, pending: 0, inProgress: 0, review: 0 });
                setTaskStats(stats);

            } catch (error) {
                console.error("Failed to fetch project overview data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
    }, [projectId]);

    if (loading) return <div className="p-8 text-center">Loading project overview...</div>;
    if (!project) return <div className="p-8 text-center">Project not found</div>;

    const progressPercentage = taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    
    // Chart Data
    const chartData = [
        { name: 'Done', value: taskStats.completed, color: '#10B981' },
        { name: 'In Progress', value: taskStats.inProgress, color: '#F59E0B' },
        { name: 'Review', value: taskStats.review, color: '#8B5CF6' },
        { name: 'Todo', value: taskStats.pending, color: '#3B82F6' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-textMain">{project.name} Overview</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs mt-3">
                    <span className="font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                        Timeline: {moment(project.startDate).format("DD MMM YYYY")} - {moment(project.endDate).format("DD MMM YYYY")}
                    </span>
                    {project.status === 'completed' && project.completedAt && (() => {
                        const completed = moment(project.completedAt);
                        const due = moment(project.endDate);
                        const completedStr = completed.format("DD MMM YYYY");
                        if (completed.isAfter(due)) {
                            const diffMonths = completed.diff(due, 'months', true);
                            const delayText = diffMonths >= 0.1 ? `+${diffMonths.toFixed(1)} months` : `+${completed.diff(due, 'days')} days`;
                            return (
                                <span className="font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg">
                                    Completed: {completedStr} ({delayText} late)
                                </span>
                            );
                        } else {
                            return (
                                <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                                    Completed: {completedStr} (On Time)
                                </span>
                            );
                        }
                    })()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-borderLight relative overflow-hidden">
                    <h3 className="text-lg font-semibold text-textMain mb-2 z-10 relative">Project Progress</h3>
                    <div className="flex items-center justify-between mt-4 relative z-10">
                        <div>
                             <p className="text-4xl font-bold text-primary">{progressPercentage}%</p>
                             <p className="text-sm text-textSub mt-1">Completed</p>
                        </div>
                        <div className="h-16 w-16">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={20} outerRadius={30} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                {/* Task Stats Card */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-borderLight">
                    <h3 className="text-lg font-semibold text-textMain mb-4">Task Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-textSub">Done</span>
                            <span className="font-bold text-textMain">{taskStats.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-textSub">In Progress</span>
                            <span className="font-bold text-textMain">{taskStats.inProgress}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-textSub">Review</span>
                            <span className="font-bold text-textMain">{taskStats.review}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-textSub">To Do</span>
                            <span className="font-bold text-textMain">{taskStats.pending}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arena Consistency Section */}
            <div className="mt-6">
                <ArenaConsistencyView projectId={project._id || projectId} projectName={project.name} />
            </div>


            {project.description && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-borderLight mt-6">
                    <h3 className="text-lg font-semibold text-textMain mb-4">Description</h3>
                    <style dangerouslySetInnerHTML={{__html: `
                        .parsed-description h3 { font-size: 1.1rem; font-weight: 700; margin-top: 1.2rem; margin-bottom: 0.6rem; color: #1E293B; }
                        .parsed-description h3:first-child { margin-top: 0; }
                        .parsed-description p { margin-bottom: 0.75rem; color: #475569; }
                        .parsed-description ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; color: #475569; }
                        .parsed-description ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; color: #475569; }
                        .parsed-description li { margin-bottom: 0.35rem; }
                        .parsed-description strong { font-weight: 700; color: #0F172A; }
                    `}} />
                    <div 
                        className="parsed-description text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                </div>
            )}
        </div>
    );
};

export default ProjectOverview;
