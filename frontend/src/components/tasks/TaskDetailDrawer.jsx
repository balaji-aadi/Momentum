
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
    IoListOutline,
    IoTimeOutline
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
            <div className="flex items-center justify-between pt-[3rem] pb-4 px-2 border-b border-slate-100 bg-white sticky top-0 z-[70] shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                        task?.status === 'done' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                        task?.status === 'inprogress' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                        {task?.status || 'Loading...'}
                    </span>
                    <span className="text-xs text-textSub font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-borderLight">{task?.taskId}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button 
                        onClick={closeDrawer} 
                        className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-all shadow-sm flex items-center justify-center border border-slate-200 hover:border-red-200 group"
                        title="Close Drawer"
                    >
                        <IoClose size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-textSub p-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm font-bold animate-pulse">Loading task details...</p>
                    </div>
                </div>
            ) : task ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Title */}
                    <div>
                        <h2 className="text-2xl font-black text-textMain tracking-tight mb-1">{task.taskName}</h2>
                        <div className="h-1 w-20 bg-primary/20 rounded-full"></div>
                    </div>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoPersonOutline /> Assignee
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                                    {task.assignee?.firstName?.[0] || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-textMain truncate leading-none">{task.assignee?.firstName || 'Unassigned'}</p>
                                    <p className="text-[10px] text-textSub mt-1">Primary Owner</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoFlagOutline /> Priority
                            </label>
                            <div className={`flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl border ${
                                task.taskPriority === 'high' ? 'border-red-100 text-red-600' : 
                                task.taskPriority === 'medium' ? 'border-amber-100 text-amber-600' : 
                                'border-blue-100 text-blue-600'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    task.taskPriority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                                    task.taskPriority === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                                    'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                }`}></span>
                                <span className="text-sm font-black truncate capitalize">{task.taskPriority}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoCalendarOutline /> Due Date
                            </label>
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <span className="text-sm font-bold text-textMain">
                                    {task.dueDate ? moment(task.dueDate).format('MMM DD, YYYY') : 'No Date Set'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoTimeOutline /> Estimation
                            </label>
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <span className="text-sm font-bold text-textMain">{task.estimatedHours || 0} Hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoDocumentTextOutline /> Description
                            </label>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                        </div>
                        <div 
                            className="w-full min-h-[120px] p-5 text-sm text-textMain bg-white border border-slate-100 rounded-3xl shadow-sm leading-relaxed quill-content break-words overflow-hidden"
                            dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                    let html = task?.taskDescription || "<p class='italic text-slate-400'>No description provided.</p>";
                                    // Robust unescaping
                                    for(let i=0; i<3; i++) {
                                        html = html.replace(/&lt;/g, '<')
                                                   .replace(/&gt;/g, '>')
                                                   .replace(/&amp;/g, '&')
                                                   .replace(/&quot;/g, '"')
                                                   .replace(/&#39;/g, "'");
                                        if (!html.includes('&')) break;
                                    }
                                    // Auto-link URLs
                                    return html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
                                })()
                            }}
                        />
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
                        
                        {task.attachments && (typeof task.attachments === 'string' || (Array.isArray(task.attachments) && task.attachments.length > 0)) ? (
                            <div className="space-y-2">
                                {(Array.isArray(task.attachments) ? task.attachments : [task.attachments]).map((attachment, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-borderLight rounded-lg group">
                                        <div className="p-2 bg-white rounded border border-borderLight text-primary">
                                            <IoDocumentTextOutline size={16} />
                                        </div>
                                        <a 
                                            href={attachment} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 text-sm text-blue-600 hover:underline truncate"
                                            title={attachment}
                                        >
                                            {attachment.split('/').pop() || `Attachment ${i + 1}`}
                                        </a>
                                        <button 
                                            onClick={() => {
                                                if (Array.isArray(task.attachments)) {
                                                    const newAttachments = task.attachments.filter((_, idx) => idx !== i);
                                                    handleUpdateTask({ attachments: newAttachments });
                                                } else {
                                                    handleUpdateTask({ attachments: "" });
                                                }
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove attachment"
                                        >
                                            <IoClose />
                                        </button>
                                    </div>
                                ))}
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
