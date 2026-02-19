import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectApi } from '../../services/api/Project.api';
import { TaskApi } from '../../services/api/Task.api';
import moment from 'moment';
import { IoAdd, IoChevronDown, IoChevronUp, IoCalendarOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const Milestones = ({ projectId: propsProjectId }) => {
    const { projectId: paramProjectId } = useParams();
    const projectId = propsProjectId || paramProjectId;
    const [milestones, setMilestones] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMilestones, setExpandedMilestones] = useState({});
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        milestoneName: '',
        commenceDate: '',
        expectedDate: '',
        deliverables: '',
        summary: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Project Data (includes milestones)
                const projectRes = await ProjectApi.getAllmileStones(projectId);
                const projectData = projectRes.data?.data;
                const fetchedMilestones = projectData?.milestones || [];

                // Fetch All Tasks for the Project
                const taskRes = await TaskApi.getAllTasks({ filter: { projectName: projectId } });
                const fetchedTasks = taskRes.data?.data || [];

                setMilestones(fetchedMilestones);
                setTasks(fetchedTasks);

                // Default expand the first active milestone
                if (fetchedMilestones.length > 0) {
                    setExpandedMilestones({ [fetchedMilestones[0]._id]: true });
                }

            } catch (error) {
                console.error("Failed to fetch milestone data", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    if (!projectId || projectId === 'undefined') {
        return <div className="p-10 text-center text-red-500">Error: Project ID is missing. Please navigate from the Project List.</div>;
    }

    const handleCreateMilestone = async (e) => {
        e.preventDefault();
        try {
            await ProjectApi.createMileStone(projectId, newMilestone);
            setShowModal(false);
            setNewMilestone({ milestoneName: '', commenceDate: '', expectedDate: '', deliverables: '', summary: '' });
            
            // Refresh
            const projectRes = await ProjectApi.getAllmileStones(projectId);
            const projectData = projectRes.data?.data;
            setMilestones(projectData?.milestones || []);
            
        } catch (error) {
            console.error("Failed to create milestone", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMilestone(prev => ({ ...prev, [name]: value }));
    };

    const toggleMilestone = (id) => {
        setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Group tasks by milestone
    const getTasksForMilestone = (milestoneId) => {
        return tasks.filter(t => t.milestone?._id === milestoneId || t.milestone === milestoneId);
    };

    const calculateProgress = (milestoneId) => {
        const mTasks = getTasksForMilestone(milestoneId);
        if (mTasks.length === 0) return 0;
        const completed = mTasks.filter(t => t.status === 'done').length;
        return Math.round((completed / mTasks.length) * 100);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-textMain">Milestones</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <IoAdd size={20} />
                    <span>Create Milestone</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading milestones...</div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-10 text-textSub">No milestones found for this project.</div>
            ) : (
                <div className="space-y-4">
                    {milestones.map((milestone) => {
                        const mTasks = getTasksForMilestone(milestone._id);
                        const progress = calculateProgress(milestone._id);
                        const isExpanded = expandedMilestones[milestone._id];

                        return (
                            <div key={milestone._id} className="bg-white border border-borderLight rounded-xl overflow-hidden shadow-sm">
                                {/* Header */}
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => toggleMilestone(milestone._id)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                             <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    className="text-slate-100"
                                                />
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={126}
                                                    strokeDashoffset={126 - (126 * progress) / 100}
                                                    className="text-primary transition-all duration-500 ease-out"
                                                />
                                            </svg>
                                            <span className="absolute text-xs font-bold text-primary">{progress}%</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-textMain">{milestone.milestoneName}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-textSub">
                                                <span className="flex items-center gap-1">
                                                    <IoCalendarOutline />
                                                    {moment(milestone.commenceDate).format('MMM D')} - {moment(milestone.expectedDate).format('MMM D, YYYY')}
                                                </span>
                                                <span>{mTasks.length} Tasks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1" onClick={(e) => { e.stopPropagation(); /* Logic to add task */ }}>
                                            <IoAdd /> Add Task
                                        </button>
                                        {isExpanded ? <IoChevronUp className="text-textSub" /> : <IoChevronDown className="text-textSub" />}
                                    </div>
                                </div>

                                {/* Body (Tasks) */}
                                {isExpanded && (
                                    <div className="border-t border-borderLight bg-slate-50/50 p-4">
                                        {mTasks.length > 0 ? (
                                            <div className="space-y-2">
                                                {mTasks.map(task => (
                                                    <div key={task._id} className="flex items-center justify-between p-3 bg-white border border-borderLight rounded-lg hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                            <span className={`text-sm font-medium ${task.status === 'done' ? 'text-textSub line-through' : 'text-textMain'}`}>
                                                                {task.taskName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                                task.taskPriority === 'high' ? 'bg-red-100 text-red-600' : 
                                                                task.taskPriority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                                                                'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {task.taskPriority}
                                                            </span>
                                                            <div className="flex -space-x-2">
                                                                {/* Assignee Avatar Placeholder */}
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-textSub font-bold">
                                                                    {task.assignee?.[0]?.toUpperCase() || 'U'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-textSub italic text-center py-4">No tasks linked to this milestone yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

             {/* Modal */}
             {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-textMain mb-4">Create New Milestone</h2>
                        <form onSubmit={handleCreateMilestone} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Milestone Name</label>
                                <input 
                                    type="text" 
                                    name="milestoneName"
                                    value={newMilestone.milestoneName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textMain mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        name="commenceDate"
                                        value={newMilestone.commenceDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textMain mb-1">Due Date</label>
                                    <input 
                                        type="date" 
                                        name="expectedDate"
                                        value={newMilestone.expectedDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Deliverables</label>
                                <textarea 
                                    name="deliverables"
                                    value={newMilestone.deliverables}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary outline-none h-20"
                                    placeholder="Key deliverables..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Summary</label>
                                <textarea 
                                    name="summary"
                                    value={newMilestone.summary}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary outline-none h-20"
                                    placeholder="Brief summary..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-textSub hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Create Milestone
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Milestones;
