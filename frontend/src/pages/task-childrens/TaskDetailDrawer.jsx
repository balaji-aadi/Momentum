import React, { useEffect, useState } from 'react';
import { IoClose, IoFlagSharp, IoCalendarOutline, IoTimeOutline, IoPersonOutline, IoAttachOutline, IoGitNetworkSharp, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { MdEdit } from 'react-icons/md';
import moment from 'moment';
window.moment = moment;
import { TaskApi } from '../../services/api/Task.api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { server } from '../../services/config';

const TaskDetailDrawer = ({ isOpen, onClose, task: initialTask, onTaskUpdate, canEdit }) => {
    const [task, setTask] = useState(initialTask);
    const [loading, setLoading] = useState(false);
    const [subtasks, setSubtasks] = useState([]);
    const [activeTab, setActiveTab] = useState('subtasks'); // 'subtasks', 'activity', 'attachments'
    const { currentUser } = useSelector(state => state.store);

    useEffect(() => {
        if (initialTask) {
            setTask(initialTask);
        }
    }, [initialTask]);

    useEffect(() => {
        if (isOpen && initialTask?._id) {
            fetchTaskDetails(initialTask._id);
            fetchSubtasks(initialTask._id);
        }
    }, [isOpen, initialTask?._id]);

    const fetchTaskDetails = async (taskId) => {
        setLoading(true);
        try {
            console.log("Fetching task details for:", taskId);
            const res = await TaskApi.getTaskById(taskId);
            console.log("Task details response:", res.data);
            setTask(res.data?.data);
        } catch (error) {
            console.error("Failed to fetch task details", error);
            console.error("Error response data:", error.response?.data);
            toast.error("Failed to fetch task details");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubtasks = async (parentId) => {
        try {
            const res = await TaskApi.getAllTasks({ filter: { parentTask: parentId } });
            setSubtasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch subtasks", error);
        }
    };

    if (!isOpen) return null;

    const priorityColors = {
        high: "bg-red-500/10 text-red-600 border-red-200/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
        medium: "bg-amber-500/10 text-amber-600 border-amber-200/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        low: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
    };

    const statusColors = {
        todo: "bg-slate-500/10 text-slate-600 border-slate-200/50",
        inprogress: "bg-blue-500/10 text-blue-600 border-blue-200/50",
        review: "bg-purple-500/10 text-purple-600 border-purple-200/50",
        done: "bg-green-500/10 text-green-600 border-green-200/50",
        hold: "bg-orange-500/10 text-orange-600 border-orange-200/50",
        backlog: "bg-gray-500/10 text-gray-600 border-gray-200/50"
    };

    return (
        <div className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            
            {/* Drawer Content */}
            <div className={`relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-[70] shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-mono font-bold text-textSub bg-slate-50 px-2 py-1 rounded border border-borderLight shadow-sm shrink-0">
                            {task?.taskId || `#${task?._id?.slice(-4)}`}
                        </span>
                        <h2 className="text-lg font-bold text-textMain truncate tracking-tight">{task?.taskName}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        {canEdit && (
                            <button 
                                onClick={() => onTaskUpdate(task)} 
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-1 text-sm font-bold"
                            >
                                <MdEdit size={20} />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose} 
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-red-500 rounded-lg transition-all shadow-sm"
                            title="Close"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* Left Main Content */}
                        <div className="md:col-span-2 space-y-8">
                            {/* Description */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">Description</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                                </div>
                                <div 
                                   className="text-textMain text-sm leading-relaxed bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm quill-content w-full max-w-full break-words overflow-hidden"
                                   dangerouslySetInnerHTML={{ 
                                       __html: (() => {
                                           let html = task?.taskDescription || "<p class='italic text-slate-400'>No description provided.</p>";
                                           // Robust unescaping for double/triple escaped content
                                           for(let i=0; i<3; i++) {
                                               html = html.replace(/&lt;/g, '<')
                                                          .replace(/&gt;/g, '>')
                                                          .replace(/&amp;/g, '&')
                                                          .replace(/&quot;/g, '"')
                                                          .replace(/&#39;/g, "'");
                                               if (!html.includes('&')) break;
                                           }
                                           // Auto-link
                                           return html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                                       })()
                                   }}
                               />
                                
                                {task?.additionalNotes && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">Assignee Notes</h3>
                                            <div className="h-px flex-1 bg-gradient-to-r from-blue-200/50 to-transparent ml-4" />
                                        </div>
                                        <div 
                                            className="text-textMain text-xs leading-relaxed bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-800/30"
                                            dangerouslySetInnerHTML={{ 
                                                __html: task.additionalNotes
                                                    .replace(/&lt;/g, '<')
                                                    .replace(/&gt;/g, '>')
                                                    .replace(/&amp;/g, '&')
                                                    .replace(/&quot;/g, '"')
                                                    .replace(/&#39;/g, "'")
                                            }}
                                        />
                                    </div>
                                )}
                            </section>

                            {/* Subtasks / Tabs Section */}
                            <section>
                                <div className="border-b border-borderLight mb-4 flex gap-6">
                                    <button 
                                        onClick={() => setActiveTab('subtasks')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'subtasks' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Subtasks
                                        {activeTab === 'subtasks' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('activity')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'activity' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Activity
                                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('attachments')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'attachments' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Attachments
                                        {activeTab === 'attachments' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                </div>

                                <div className="min-h-[200px]">
                                    {activeTab === 'subtasks' && (
                                        <div className="space-y-4">
                                            {task?.subtaskStats?.total > 0 ? (
                                                <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Overall Subtask Progress</span>
                                                        <span className="text-xs font-bold text-textMain">{task.subtaskStats.completed}/{task.subtaskStats.total} Completed</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                                                        <div 
                                                            className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                            style={{ width: `${(task.subtaskStats.completed / task.subtaskStats.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {subtasks.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {subtasks.map(sub => (
                                                        <div key={sub._id} className="group p-3 bg-white border border-borderLight rounded-xl hover:border-primary/30 hover:shadow-sm transition-all flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${sub.status === 'done' ? 'bg-green-500' : 'bg-blue-400'}`} />
                                                                <div className="min-w-0">
                                                                    <p className={`text-sm font-bold truncate leading-none mb-1 ${sub.status === 'done' ? 'text-textSub/60 line-through' : 'text-textMain'}`}>{sub.taskName}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-mono font-bold text-textSub bg-slate-100 px-1.5 py-0.5 rounded">{sub.taskId || 'N/A'}</span>
                                                                        <span className={`text-[10px] font-bold uppercase ${statusColors[sub.status]} px-1.5 py-0.5 rounded`}>{sub.status}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[10px] font-bold text-textSub uppercase">Assignee</p>
                                                                <p className="text-xs font-semibold text-textMain">{sub.assignee?.firstName || 'Unassigned'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                        <IoGitNetworkSharp className="text-slate-300" size={24} />
                                                    </div>
                                                    <p className="text-sm text-textSub font-bold tracking-tight">No subtasks found.</p>
                                                    <p className="text-xs text-textSub/60 mt-1">This task has no child tasks assigned to it.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'activity' && (
                                        <div className="space-y-4">
                                            {task?.activityLogs?.map((log, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-white ring-2 ring-slate-50 group-last:ring-0">
                                                            <IoCheckmarkCircleOutline className="text-primary" />
                                                        </div>
                                                        <div className="w-0.5 h-full bg-slate-100 group-last:hidden" />
                                                    </div>
                                                    <div className="pb-4 pt-1">
                                                        <p className="text-sm font-semibold text-textMain capitalize">{log.currentStatus}</p>
                                                        <p className="text-xs text-textSub mt-0.5">{log.message}</p>
                                                        <p className="text-[10px] text-textSub mt-1">{moment(log.date).fromNow()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'attachments' && (
                                        <div className="grid grid-cols-2 gap-4">
                                    {task?.attachments?.filter(f => f && f.trim() !== "").map((filename, i) => {
                                        const fileUrl = filename.startsWith('http') ? filename : `${server}file/get-file/${filename}`;
                                        const displayName = filename.split('/').pop().includes('-') ? filename.split('/').pop().split('-').slice(1).join('-') : filename.split('/').pop();
                                        return (
                                            <div key={i} className="p-3 bg-white border border-borderLight rounded-lg shadow-sm hover:border-primary/30 transition-all flex items-center gap-3">
                                                <div className="p-2 bg-primary/5 rounded">
                                                    <IoAttachOutline size={20} className="text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-textMain truncate" title={filename}>{filename.split('-').slice(1).join('-') || filename}</p>
                                                    <a 
                                                        href={fileUrl} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="text-[10px] text-primary hover:underline font-extrabold uppercase tracking-tight flex items-center gap-1 mt-1"
                                                    >
                                                        Download / View
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    }) || (
                                        <p className="text-sm text-textSub col-span-2 text-center py-10">No attachments found.</p>
                                    )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar Metadata */}
                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Status</label>
                                <span className={`px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest border transition-all hover:scale-105 duration-300 inline-block ${statusColors[task?.status] || 'bg-slate-100'}`}>
                                    {task?.status}
                                </span>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Priority</label>
                                <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase border transition-all hover:scale-105 duration-300 ${priorityColors[task?.taskPriority] || 'bg-slate-100'}`}>
                                    <IoFlagSharp className="text-sm" /> {task?.taskPriority}
                                </span>
                            </div>

                            {/* Dates */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <IoCalendarOutline size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Start Date</label>
                                            <span className="text-xs font-bold text-textMain">{task?.taskStartDate ? moment(task.taskStartDate).format("MMM DD, YYYY") : "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <IoCalendarOutline size={16} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Due Date</label>
                                            <span className="text-xs font-bold text-textMain">{task?.taskDueDate ? moment(task.taskDueDate).format("MMM DD, YYYY") : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                        <IoTimeOutline size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Estimation</label>
                                        <span className="text-xs font-bold text-textMain">{task?.estimatedHours || 0} Hours</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Assignee</label>
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="relative">
                                        {task?.assignee?.profileImage ? (
                                            <img src={task.assignee.profileImage} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-md">
                                                <IoPersonOutline className="text-primary text-2xl" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-textMain truncate tracking-tight">
                                            {task?.assignee?.firstName} {task?.assignee?.lastName}
                                        </p>
                                        <p className="text-[10px] font-bold text-textSub truncate opacity-70">
                                            {task?.assignee?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailDrawer;
