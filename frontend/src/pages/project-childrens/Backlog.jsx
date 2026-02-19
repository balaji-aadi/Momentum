import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TaskApi } from '../../services/api/Task.api';
import { SprintApi } from '../../services/api/Sprint.api';
import { IoAdd, IoChevronDown, IoChevronUp, IoCalendarOutline, IoEllipsisHorizontal, IoInformationCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';
import moment from 'moment';

const Backlog = () => {
    const { projectId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sprints, setSprints] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSprints, setExpandedSprints] = useState({});

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, tRes] = await Promise.all([
                SprintApi.getSprintsByProject(projectId),
                TaskApi.getAllTasks({ filter: { projectName: projectId } })
            ]);

            const fetchedSprints = sRes.data?.data || [];
            setSprints(fetchedSprints);
            setTasks(tRes.data?.data || []);

            // Auto-expand active sprint
            const activeSprint = fetchedSprints.find(s => s.status === 'active');
            if (activeSprint) {
                setExpandedSprints(prev => ({ ...prev, [activeSprint._id]: true }));
            }
        } catch (error) {
            console.error("Failed to fetch backlog data", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSprint = (sprintId) => {
        setExpandedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
    };

    const getTasksForSprint = (sprintId, allTasks) => {
        return allTasks.filter(t => t.sprint === sprintId || t.sprint?._id === sprintId);
    };

    const getBacklogTasks = () => {
        return tasks.filter(t => !t.sprint);
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceSprintId = source.droppableId === 'backlog' ? null : source.droppableId;
        const destSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;

        // Optimistic UI Update
        const updatedTasks = tasks.map(t => 
            t._id === draggableId ? { ...t, sprint: destSprintId } : t
        );
        setTasks(updatedTasks);

        try {
            // Backend Update
            // If destSprintId is null, we are sending null to Unassign sprint
            await TaskApi.updateTask(draggableId, { sprint: destSprintId });
            
            // Optional: Reload to ensure sync
            // fetchData(); 
        } catch (error) {
            console.error("Failed to move task", error);
            fetchData(); // Revert on error
        }
    };

    const handleTaskClick = (taskId) => {
        setSearchParams({ taskId });
    };

    const TaskItem = ({ task, index }) => {
        const isOverdue = task.taskDueDate && moment(task.taskDueDate).isBefore(moment(), 'day') && task.status !== 'done';

        return (
            <Draggable draggableId={String(task._id)} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 bg-white border ${isOverdue ? 'border-red-300 bg-red-50/50' : 'border-borderLight'} rounded-lg hover:shadow-sm flex items-center justify-between group mb-2 transition-colors`}
                        onClick={() => handleTaskClick(task._id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                                 task.taskPriority === 'high' ? 'bg-red-500' : 
                                 task.taskPriority === 'medium' ? 'bg-orange-500' : 
                                 'bg-blue-500'
                            }`}></div>
                            <span className="text-sm text-textMain font-medium">{task.taskName}</span>
                             <span className="text-xs text-textSub font-mono px-1.5 py-0.5 bg-slate-100 rounded">
                                {task.taskId || `#${task._id.slice(-4)}`}
                            </span>
                             {isOverdue && (
                                <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                                    <IoAlertCircleOutline /> Overdue
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                 {task.assignee && (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] text-textSub font-bold">
                                        {task.assignee.firstName?.[0]}
                                    </div>
                                 )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-textSub">
                                <span className={`px-2 py-0.5 rounded capitalize ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                                    {task.status}
                                </span>
                                {task.storyPoints > 0 && (
                                    <span className="px-2 py-0.5 bg-slate-200 rounded font-bold text-textMain">{task.storyPoints}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Draggable>
        );
    };

    if (loading) return <div className="p-8 text-center text-textSub">Loading backlog...</div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6"> 
            <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-textMain">Backlog</h1>
                    <div className="group relative">
                        <IoInformationCircleOutline className="text-textSub cursor-help" />
                        <div className="absolute left-0 mt-2 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            Backlog contains tasks not yet assigned to a sprint. Overdue tasks are highlighted in red.
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.href = `/project/${projectId}/sprints`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <IoAdd size={20} />
                    <span>Create Sprint</span>
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-10">
                    {/* Sprints List */}
                    {sprints.map(sprint => {
                        const sprintTasks = getTasksForSprint(sprint._id, tasks);
                        const isExpanded = expandedSprints[sprint._id];
                        
                        return (
                            <div key={sprint._id} className="bg-slate-50/50 border border-borderLight rounded-xl overflow-hidden shrink-0">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    onClick={() => toggleSprint(sprint._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {isExpanded ? <IoChevronUp className="text-textSub" /> : <IoChevronDown className="text-textSub" />}
                                        <div>
                                            <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
                                                {sprint.name}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    sprint.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {sprint.status}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-textSub mt-0.5 flex items-center gap-2">
                                                <IoCalendarOutline />
                                                {moment(sprint.startDate).format('MMM D')} - {moment(sprint.endDate).format('MMM D')}
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                {sprintTasks.length} Issues
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         {sprint.status !== 'completed' && (
                                            <button 
                                                className="px-3 py-1.5 text-xs font-medium bg-white border border-borderLight rounded shadow-sm hover:bg-slate-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Handle sprint action
                                                }}
                                            >
                                                {sprint.status === 'active' ? 'Complete Sprint' : 'Start Sprint'}
                                            </button>
                                         )}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <Droppable droppableId={sprint._id}>
                                        {(provided, snapshot) => (
                                            <div 
                                                ref={provided.innerRef} 
                                                {...provided.droppableProps}
                                                className={`p-4 min-h-[50px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100' : ''}`}
                                            >
                                                {sprintTasks.length > 0 ? (
                                                    sprintTasks.map((task, index) => (
                                                        <TaskItem key={task._id} task={task} index={index} />
                                                    ))
                                                ) : (
                                                    <div className="text-center text-xs text-textSub py-4 border border-dashed border-borderLight rounded-lg">
                                                        Drag tasks here to plan this sprint
                                                    </div>
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                )}
                            </div>
                        );
                    })}

                    {/* Backlog Section */}
                    <div className="bg-slate-50/50 border border-borderLight rounded-xl overflow-hidden mt-8 shrink-0">
                        <div className="p-4 flex items-center justify-between border-b border-borderLight">
                            <div>
                                <h3 className="text-sm font-bold text-textMain">Backlog</h3>
                                <p className="text-xs text-textSub mt-0.5">{getBacklogTasks().length} Issues</p>
                            </div>
                             <button className="text-primary text-xs font-bold hover:underline">
                                + Create Issue
                             </button>
                        </div>
                        <Droppable droppableId="backlog">
                             {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef} 
                                    {...provided.droppableProps}
                                    className={`p-4 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100' : ''}`}
                                >
                                    {getBacklogTasks().map((task, index) => (
                                        <TaskItem key={task._id} task={task} index={index} />
                                    ))}
                                    {provided.placeholder}
                                </div>
                             )}
                        </Droppable>
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
};

export default Backlog;
