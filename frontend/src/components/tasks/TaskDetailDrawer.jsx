
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { TaskApi } from '../../services/api/Task.api';
import { SprintApi } from '../../services/api/Sprint.api';
import { ProjectApi } from '../../services/api/Project.api';
import { CommonApi } from '../../services/api/Common.api';
import { IoRepeatOutline, IoTrophyOutline } from 'react-icons/io5';

import moment from 'moment';
import { 
    IoClose, 
    IoCheckmarkCircleOutline, 
    IoCalendarOutline, 
    IoFlagOutline, 
    IoPersonOutline,
    IoDocumentTextOutline,
    IoChatbubbleEllipsesOutline,
    IoListOutline
} from 'react-icons/io5';

const TaskDetailDrawer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get taskId from query params
    const taskId = searchParams.get('taskId');
    
    const [task, setTask] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [creatingSubtask, setCreatingSubtask] = useState(false);
    const [sprints, setSprints] = useState([]);
    const [milestones, setMilestones] = useState([]);

    useEffect(() => {
        if (!taskId) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await TaskApi.task(taskId);
                const taskData = res.data?.data?.[0] || res.data?.data;
                setTask(taskData);

                if (taskData?.projectName) {
                    const [sRes, mRes] = await Promise.all([
                        SprintApi.getSprintsByProject(taskData.projectName),
                        ProjectApi.getAllmileStones(taskData.projectName)
                    ]);
                    setSprints(sRes.data?.data || []);
                    setMilestones(mRes.data?.data?.milestones || []);
                }

                const subRes = await TaskApi.getAllTasks({ filter: { parentTask: taskId } });
                setSubtasks(subRes.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch task details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [taskId]);

    const handleUpdateTask = async (updates) => {
        try {
            // Optimistic update
            setTask(prev => ({ ...prev, ...updates }));
            await TaskApi.updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to update task", error);
            // Revert logic could be added here
        }
    };



    const handleAddSubtask = async () => {
        if (!newSubtaskName.trim() || !task) return;
        setCreatingSubtask(true);
        try {
            const payload = {
                taskName: newSubtaskName,
                projectName: task.projectName,
                parentTask: task._id,
                taskPriority: 'medium', // Default
                taskType: 'subtask',
                status: 'todo',
                sprint: task.sprint, // Inherit Sprint
                milestone: task.milestone // Inherit Milestone
            };
            const res = await TaskApi.createTask(payload);
            const newSub = res.data?.data;
            if (newSub) {
                setSubtasks([...subtasks, newSub]);
                setNewSubtaskName('');
                setShowAddSubtask(false); // Optional: keep open for multiple adds
            }
        } catch (error) {
            console.error("Failed to create subtask", error);
        } finally {
            setCreatingSubtask(false);
        }
    };

    const toggleSubtaskStatus = async (subtask) => {
        const newStatus = subtask.status === 'done' ? 'todo' : 'done';
        // Optimistic Update
        const updatedSubtasks = subtasks.map(s => 
            s._id === subtask._id ? { ...s, status: newStatus } : s
        );
        setSubtasks(updatedSubtasks);

        try {
            await TaskApi.updateTask(subtask._id, { status: newStatus });
        } catch (error) {
            console.error("Failed to update subtask status", error);
            // Revert on error
            setSubtasks(subtasks); 
        }
    };

    const calculateSubtaskProgress = () => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.status === 'done').length;
        return Math.round((completed / subtasks.length) * 100);
    };

    const closeDrawer = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('taskId');
        setSearchParams(newParams);
    };

    if (!taskId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-borderLight flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-borderLight bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        task?.status === 'done' ? 'bg-green-100 text-green-700' : 
                        task?.status === 'review' ? 'bg-purple-100 text-purple-700' :
                        task?.status === 'inprogress' ? 'bg-amber-100 text-amber-700' :
                        task?.status === 'todo' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                        {task?.status || 'Loading...'}
                    </span>
                    <span className="text-xs text-textSub font-mono">{task?.taskId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={closeDrawer} className="p-2 hover:bg-slate-200 rounded-lg text-textSub transition-colors">
                        <IoClose size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-textSub">
                    Loading task details...
                </div>
            ) : task ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <input 
                            type="text" 
                            defaultValue={task.taskName}
                            className="w-full text-xl font-bold text-textMain bg-transparent border-none focus:ring-0 p-0 placeholder-textSub/50"
                            placeholder="Task Name"
                        />
                    </div>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <label className="text-xs text-textSub font-medium flex items-center gap-1">
                                <IoPersonOutline /> Assignee
                            </label>
                            <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-borderLight">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    {task.assignee?.firstName?.[0] || 'U'}
                                </div>
                                <span className="text-textMain font-medium">{task.assignee?.firstName || 'Unassigned'}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-textSub font-medium flex items-center gap-1">
                                <IoFlagOutline /> Priority
                            </label>
                            <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-borderLight">
                                <span className={`w-2 h-2 rounded-full ${
                                    task.taskPriority === 'high' ? 'bg-red-500' : 
                                    task.taskPriority === 'medium' ? 'bg-orange-500' : 
                                    'bg-blue-500'
                                }`}></span>
                                <span className="text-textMain font-medium capitalize">{task.taskPriority}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-textSub font-medium flex items-center gap-1">
                                <IoCalendarOutline /> Due Date
                            </label>
                            <div className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-borderLight">
                                <span className="text-textMain font-medium">
                                    {task.dueDate ? moment(task.dueDate).format('MMM D, YYYY') : 'No Date'}
                                </span>
                            </div>
                        </div>

                         <div className="space-y-1">
                            <label className="text-xs text-textSub font-medium flex items-center gap-1">
                                <IoRepeatOutline /> Sprint
                            </label>
                            <select 
                                className="w-full p-2 bg-transparent hover:bg-slate-50 border border-transparent hover:border-borderLight rounded-lg text-textMain font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                                value={typeof task.sprint === 'object' ? task.sprint?._id : task.sprint || ''}
                                onChange={(e) => handleUpdateTask({ sprint: e.target.value })}
                            >
                                <option value="">No Sprint</option>
                                {sprints.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-textSub font-medium flex items-center gap-1">
                                <IoTrophyOutline /> Milestone
                            </label>
                            <select 
                                className="w-full p-2 bg-transparent hover:bg-slate-50 border border-transparent hover:border-borderLight rounded-lg text-textMain font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                                value={typeof task.milestone === 'object' ? task.milestone?._id : task.milestone || ''}
                                onChange={(e) => handleUpdateTask({ milestone: e.target.value })}
                            >
                                <option value="">No Milestone</option>
                                {milestones.map(m => (
                                    <option key={m._id} value={m._id}>{m.milestoneName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-borderLight w-full my-4"></div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                            <IoDocumentTextOutline /> Description
                        </label>
                        <textarea 
                            className="w-full min-h-[100px] p-3 text-sm text-textMain bg-slate-50 border border-borderLight rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
                            placeholder="Add a description..."
                            defaultValue={task.description}
                        ></textarea>
                    </div>

                    {/* Subtasks Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                                <IoListOutline /> Subtasks
                            </label>
                            <button 
                                onClick={() => setShowAddSubtask(!showAddSubtask)}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                + Add Subtask
                            </button>
                        </div>
                        
                        {/* Progress Bar */}
                        {subtasks.length > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                <div 
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${calculateSubtaskProgress()}%` }}
                                ></div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {/* Add Subtask Input */}
                            {showAddSubtask && (
                                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-borderLight rounded-lg">
                                    <input 
                                        type="text" 
                                        value={newSubtaskName}
                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        placeholder="What needs to be done?"
                                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleAddSubtask}
                                        disabled={creatingSubtask || !newSubtaskName.trim()}
                                        className="text-primary text-xs font-bold disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* Subtask List */}
                            {subtasks.length > 0 ? (
                                subtasks.map(subtask => (
                                    <div key={subtask._id} className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-borderLight transition-colors">
                                        <button 
                                            onClick={() => toggleSubtaskStatus(subtask)}
                                            className={`text-slate-400 hover:text-green-600 transition-colors ${subtask.status === 'done' ? 'text-green-500' : ''}`}
                                        >
                                            <IoCheckmarkCircleOutline size={20} />
                                        </button>
                                        <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'text-textSub line-through' : 'text-textMain'}`}>
                                            {subtask.taskName}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                            {/* Assignee Avatar (Small) */}
                                            {subtask.assignee && (
                                                <div 
                                                    className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold"
                                                    title={subtask.assignee.firstName}
                                                >
                                                    {subtask.assignee.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !showAddSubtask && (
                                    <div className="p-4 border border-dashed border-borderLight rounded-lg text-center cursor-pointer hover:bg-slate-50" onClick={() => setShowAddSubtask(true)}>
                                        <p className="text-xs text-textSub">No subtasks yet. Click to add one.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                     {/* Attachments Section */}
                     <div className="h-px bg-borderLight w-full my-4"></div>
                     <div className="space-y-4">
                        <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                            <IoDocumentTextOutline /> Attachments
                        </label>
                        
                        {task.attachments && typeof task.attachments === 'string' ? (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-borderLight rounded-lg group">
                                <div className="p-2 bg-white rounded border border-borderLight text-primary">
                                    <IoDocumentTextOutline size={16} />
                                </div>
                                <a 
                                    href={task.attachments} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                                    title={task.attachments}
                                >
                                    {task.attachments.split('/').pop() || "View Attachment"}
                                </a>
                                <button 
                                    onClick={() => handleUpdateTask({ attachments: "" })}
                                    className="p-1 hover:bg-slate-200 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove attachment"
                                >
                                    <IoClose />
                                </button>
                            </div>
                        ) : (
                            <div className="relative border border-dashed border-borderLight rounded-lg p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                                <input 
                                    type="file" 
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        
                                        // Simple toast or loading state here would be good
                                        try {
                                            const res = await CommonApi.uploadFile(formData);
                                            const fileUrl = res.data?.data?.url || res.data?.url || res.data?.data;
                                            if (fileUrl) {
                                                handleUpdateTask({ attachments: fileUrl });
                                            }
                                        } catch (err) {
                                            console.error("Upload failed", err);
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="flex flex-col items-center gap-1 text-textSub">
                                    <span className="text-xs font-medium">Click to upload attachment</span>
                                </div>
                            </div>
                        )}
                     </div>

                     <div className="h-px bg-borderLight w-full my-4"></div>

                     {/* Comments Placeholder */}
                     <div className="space-y-4">
                        <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                            <IoChatbubbleEllipsesOutline /> Comments
                        </label>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"></div>
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Write a comment..." 
                                    className="w-full px-4 py-2 text-sm border border-borderLight rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>
                     </div>

                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-textSub">
                    Task not found.
                </div>
            )}
        </div>
    );
};

export default TaskDetailDrawer;
