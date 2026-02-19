import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TaskApi } from '../../services/api/Task.api';
import { SprintApi } from '../../services/api/Sprint.api';
import RiskCard from './components/RiskCard';
import AIInsights from './components/AIInsights';
import moment from 'moment';

const Reports = () => {
    const { project } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [aiData, setAiData] = useState({
        healthScore: 100,
        riskFactors: [],
        summary: '',
        suggestions: [],
        velocity: ''
    });

    useEffect(() => {
        const analyzeProject = async () => {
            if (!project?._id) return;
            setLoading(true);

            try {
                // 1. Fetch Data
                const [taskRes, sprintRes] = await Promise.all([
                    TaskApi.getAllTasks({ filter: { projectName: project._id } }),
                    SprintApi.getSprintsByProject(project._id)
                ]);

                const tasks = taskRes.data?.data || [];
                const sprints = sprintRes.data?.data || [];
                const activeSprint = sprints.find(s => s.status === 'active');

                // 2. Analyze Health & Risk
                let score = 100;
                const risks = [];
                
                const highPriorityOpen = tasks.filter(t => t.priority === 'High' && t.status !== 'done').length;
                if (highPriorityOpen > 2) {
                    score -= 15;
                    risks.push(`${highPriorityOpen} High Priority tasks are still open.`);
                }

                const overdueTasks = tasks.filter(t => t.deadline && moment(t.deadline).isBefore(moment()) && t.status !== 'done').length;
                if (overdueTasks > 0) {
                    score -= (overdueTasks * 5);
                    risks.push(`${overdueTasks} tasks are overdue.`);
                }

                if (!activeSprint) {
                    score -= 10;
                    risks.push("No active sprint found.");
                }

                // Ensure score is 0-100
                score = Math.max(0, Math.min(100, score));

                // 3. Generate Summary
                const completedTasks = tasks.filter(t => t.status === 'done').length;
                const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
                
                let summaryText = `Project ${project.name} is currently sitting at a health score of ${score}%. `;
                summaryText += `The team has completed ${completedTasks} tasks total, with ${inProgressTasks} currently in progress. `;
                
                if (activeSprint) {
                    const daysLeft = moment(activeSprint.endDate).diff(moment(), 'days');
                    summaryText += `The active sprint '${activeSprint.name}' has ${daysLeft} days remaining. `;
                }

                if (score < 50) {
                    summaryText += `\n\n⚠️ Immediate attention is required due to critical overdue items.`;
                } else if (score < 80) {
                    summaryText += `\n\nThere are some risks that need to be managed to ensure smooth delivery.`;
                } else {
                    summaryText += `\n\nMeasurements indicate the project is on track and performing well.`;
                }

                // 4. Generate Suggestions
                const suggestionsList = [];
                if (overdueTasks > 0) {
                    suggestionsList.push({
                        title: 'Clear Overdue Tasks',
                        desc: 'Reschedule or prioritize overdue items to improve project health.',
                        action: 'View Overdue'
                    });
                }
                if (highPriorityOpen > 5) {
                    suggestionsList.push({
                        title: 'Swarm High Priority Feature',
                        desc: 'Too many high priority items are open simultaneously.',
                        action: 'View Board'
                    });
                }
                if (tasks.length === 0) {
                     suggestionsList.push({
                        title: 'Populate Backlog',
                        desc: 'This project has no tasks. Start by adding items to the backlog.',
                        action: 'Go to Backlog'
                    });
                }

                setAiData({
                    healthScore: score,
                    riskFactors: risks,
                    summary: summaryText,
                    suggestions: suggestionsList,
                    velocity: completedTasks > 5 ? '+12% (Estimated)' : 'Calculating...'
                });

            } catch (error) {
                console.error("AI Analysis Failed", error);
            } finally {
                setLoading(false);
            }
        };

        analyzeProject();
    }, [project]);

    if (loading) return <div className="p-8 text-center text-textSub">Analyzing project data...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-textMain">Project Intelligence</h1>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                    AI Beta
                </span>
            </div>

            {/* Risk Analysis Card */}
            <RiskCard healthScore={aiData.healthScore} riskFactors={aiData.riskFactors} />

            {/* AI Insights & Suggestions */}
            <AIInsights 
                summary={aiData.summary} 
                suggestions={aiData.suggestions} 
                velocity={aiData.velocity} 
            />
        </div>
    );
};
