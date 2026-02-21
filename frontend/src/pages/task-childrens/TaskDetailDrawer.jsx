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
        high: "bg-red-100 text-red-700 border-red-200",
        medium: "bg-amber-100 text-amber-700 border-amber-200",
        low: "bg-emerald-100 text-emerald-700 border-emerald-200"
    };

    const statusColors = {
        todo: "bg-slate-100 text-slate-700",
        inprogress: "bg-blue-100 text-blue-700",
        review: "bg-purple-100 text-purple-700",
        done: "bg-green-100 text-green-700",
        hold: "bg-orange-100 text-orange-700",
        backlog: "bg-gray-100 text-gray-700"
    };

    return (
        <div className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            
            {/* Drawer Content */}
            <div className={`relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-borderLight bg-slate-50">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-textSub bg-white px-2 py-1 rounded border border-borderLight shadow-sm">
                            {task?.taskId || `#${task?._id?.slice(-4)}`}
                        </span>
                        <h2 className="text-lg font-bold text-textMain truncate max-w-md">{task?.taskName}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {canEdit && (
                            <button 
                                onClick={() => onTaskUpdate(task)} 
                                className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primaryDark transition-colors"
                            >
                                <MdEdit size={18} /> Edit
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <IoClose size={24} className="text-textSub" />
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
                                <h3 className="text-sm font-bold text-textSub uppercase tracking-wider mb-3">Description</h3>
                                <div className="text-textMain text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {task?.taskDescription || "No description provided."}
                                </div>
                            </section>

                            {/* Subtasks / Tabs Section */}
                            <section>
                                <div className="border-b border-borderLight mb-4 flex gap-6">
                                    <button 
                                        onClick={() => setActiveTab('subtasks')}
                                        className={`pb-2 px-1 text-sm font-bold transition-colors relative ${activeTab === 'subtasks' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Subtasks
                                        {activeTab === 'subtasks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('activity')}
                                        className={`pb-2 px-1 text-sm font-bold transition-colors relative ${activeTab === 'activity' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Activity
                                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('attachments')}
                                        className={`pb-2 px-1 text-sm font-bold transition-colors relative ${activeTab === 'attachments' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Attachments
                                        {activeTab === 'attachments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
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
                                <label className="text-[10px] font-bold text-textSub uppercase mb-2 block tracking-wider">Status</label>
                                <span className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wide inline-block ${statusColors[task?.status] || 'bg-slate-100'}`}>
                                    {task?.status}
                                </span>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-[10px] font-bold text-textSub uppercase mb-2 block tracking-wider">Priority</label>
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase border ${priorityColors[task?.taskPriority] || 'bg-slate-100'}`}>
                                    <IoFlagSharp /> {task?.taskPriority}
                                </span>
                            </div>

                            {/* Dates */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-textSub uppercase mb-1 block tracking-wider">Start Date</label>
                                    <div className="flex items-center gap-2 text-textMain font-semibold">
                                        <IoCalendarOutline className="text-textSub" />
                                        <span className="text-sm">{task?.taskStartDate ? moment(task.taskStartDate).format("MMM DD, YYYY") : "N/A"}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-textSub uppercase mb-1 block tracking-wider">Due Date</label>
                                    <div className="flex items-center gap-2 text-textMain font-semibold">
                                        <IoCalendarOutline className="text-textSub" />
                                        <span className="text-sm">{task?.taskDueDate ? moment(task.taskDueDate).format("MMM DD, YYYY") : "N/A"}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-textSub uppercase mb-1 block tracking-wider">Estimation</label>
                                    <div className="flex items-center gap-2 text-textMain font-semibold">
                                        <IoTimeOutline className="text-textSub" />
                                        <span className="text-sm">{task?.estimatedHours || 0} Hours</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[10px] font-bold text-textSub uppercase mb-2 block tracking-wider">Assignee</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {task?.assignee?.profileImage ? (
                                        <img src={task.assignee.profileImage} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                                            <IoPersonOutline className="text-primary" size={20} />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-textMain truncate leading-tight">
                                            {task?.assignee?.firstName} {task?.assignee?.lastName}
                                        </p>
                                        <p className="text-[10px] text-textSub truncate">{task?.assignee?.email}</p>
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
