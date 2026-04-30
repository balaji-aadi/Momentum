import React, { useState, useEffect, useRef, useMemo } from "react";
import moment from "moment";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Column from "./Column";
import { TaskApi } from "../../services/api/Task.api";
import { FocusApi } from "../../services/api/Focus.api";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import TaskDetailDrawer from "./TaskDetailDrawer";
import CreateTask from "./CreateTask";

const Board = ({
  tasks,
  setTasks,
  selectedProject,
  handleClick,
  selectedMember,
  milestoneId,
  sprintStarted = true // Default to true for non-sprint boards
}) => {
  const [showToast, setShowToast] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [taskInProgress, setTaskInProgress] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(
    localStorage.getItem("dontShowInProgressToast") === "true"
  );
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);

  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState([]);

  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [isDoneReorganized, setIsDoneReorganized] = useState(true);
  const [expandedParents, setExpandedParents] = useState([]);
  const reorganizeTimerRef = useRef(null);

  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  const isAdmin = currentUser?.userRole?.name === "admin";
  const canEdit = isManager || isAdmin;

  const [boardTasks, setBoardTasks] = useState([]);

  const sortedBoardTasks = useMemo(() => {
    const today = moment().startOf('day');

    const getActivationScore = (task) => {
        // Score 2: Own start date has arrived
        const ownStart = task.taskStartDate ? moment(task.taskStartDate).startOf('day') : null;
        if (ownStart && ownStart.isSameOrBefore(today)) return 2;

        // Score 1: Parent's start date has arrived (inherited activation)
        if (task.parentTask) {
            const pId = typeof task.parentTask === 'object' ? task.parentTask._id : task.parentTask;
            const parent = boardTasks.find(pt => pt._id === pId);
            if (parent) {
                const psd = parent.taskStartDate ? moment(parent.taskStartDate).startOf('day') : null;
                if (psd && psd.isSameOrBefore(today)) return 1;
            }
        }
        return 0;
    };

    return [...boardTasks].sort((a, b) => {
      const scoreA = getActivationScore(a);
      const scoreB = getActivationScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Fallback: Date wise (Newest Created First)
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [boardTasks]);

  useEffect(() => {
    // Clear board state immediately on any project/context change to prevent data leak
    setBoardTasks([]);
    
    if (tasks) {
      setBoardTasks(tasks);
    } else {
        fetchTasks();
    }
  }, [tasks, selectedProject, selectedMember, milestoneId]);

  const columns = [
    { id: "todo-parent", name: "To Do - Parent" },
    { id: "todo-subtask", name: "To Do - Child" },
    { id: "inprogress", name: "In Progress" },
    { id: "done", name: "Done" },
    { id: "hold", name: "Hold" },
    { id: "backlog", name: "Backlog" },
  ];

  // backlogged tasks calculation
  const backlogTasks = useMemo(() => {
    return sortedBoardTasks.filter(task => {
      // Explicit backlog status
      if (task.status === 'backlog') return true;
      if (task.status === 'done') return false;

      // Only treat as backlog if the task's own due date has passed
      const due = task.taskDueDate ? moment(task.taskDueDate) : null;
      const today = moment().startOf('day');
      
      if (due && due.isBefore(today)) {
          return true;
      }
      
      return false;
    });
  }, [sortedBoardTasks]);

  const nonBacklogTasks = sortedBoardTasks.filter((t) => !backlogTasks.includes(t));

  const parentTasksOnly = nonBacklogTasks.filter((t) => !t.parentTask && (selectedParentId ? t._id === selectedParentId : true));
  const allSubtasks = nonBacklogTasks.filter((t) => t.parentTask);

  // Derive unique Parent Tasks dynamically from the subtasks available
  const uniqueParents = Array.from(new Set(allSubtasks.map(t => typeof t.parentTask === 'object' ? t.parentTask._id : t.parentTask)))
      .map(id => {
          const sample = allSubtasks.find(t => (typeof t.parentTask === 'object' ? t.parentTask._id : t.parentTask) === id);
          if (sample && typeof sample.parentTask === 'object') {
              return sample.parentTask;
          }
          // If it's a string ID, try finding it in all board tasks
          return sortedBoardTasks.find(t => t._id === id);
      }).filter(Boolean);

  // Group parent tasks by their standard Status columns
  const groupedTasks = columns.map((column) => {
    let combinedTasks = [];

    if (column.id === "backlog") {
      combinedTasks = backlogTasks;
    } else if (column.id === "todo-parent") {
      combinedTasks = parentTasksOnly.filter((task) => task.status === "todo");
    } else if (column.id === "todo-subtask") {
      const filteredSubtasks = selectedParentId
        ? allSubtasks.filter(
            (t) =>
              (typeof t.parentTask === "object"
                ? t.parentTask._id
                : t.parentTask) === selectedParentId
          )
        : allSubtasks;
      combinedTasks = filteredSubtasks.filter((task) => task.status === "todo");
    } else if (column.id === "done") {
        const doneTasks = sortedBoardTasks.filter(t => t.status === "done");
        
        if (!isDoneReorganized) {
            combinedTasks = doneTasks;
        } else {
            // Group subtasks under their parents if both are done
            const doneParents = doneTasks.filter(t => !t.parentTask);
            const doneChildren = doneTasks.filter(t => t.parentTask);
            
            const processedParents = doneParents.map(parent => {
                const nestedChildren = doneChildren.filter(child => {
                    const pId = typeof child.parentTask === 'object' ? child.parentTask._id : child.parentTask;
                    return pId === parent._id;
                });
                
                const finishDate = parent.activityLogs?.find(log => log.currentStatus === 'done')?.date || parent.updatedAt;
                
                return {
                    ...parent,
                    isDoneGroup: true,
                    nestedChildren,
                    actualFinishDate: finishDate
                };
            });
            
            const orphanDoneChildren = doneChildren.filter(child => {
                const pId = typeof child.parentTask === 'object' ? child.parentTask._id : child.parentTask;
                return !doneParents.find(p => p._id === pId);
            });
            
            // Sort parents by actual finish date (Oldest top, Newest bottom)
            processedParents.sort((a, b) => new Date(a.actualFinishDate) - new Date(b.actualFinishDate));
            
            combinedTasks = [...processedParents, ...orphanDoneChildren];
        }
    } else {
      const filteredSubtasks = selectedParentId
        ? allSubtasks.filter(
            (t) =>
              (typeof t.parentTask === "object"
                ? t.parentTask._id
                : t.parentTask) === selectedParentId
          )
        : allSubtasks;

      combinedTasks = [
        ...parentTasksOnly.filter((task) => task.status === column.id),
        ...filteredSubtasks.filter((task) => task.status === column.id),
      ];
    }

    return {
      ...column,
      tasks: combinedTasks,
    };
  });

  const fetchTasks = async () => {
    if (tasks) return; // Don't fetch if tasks are provided via props
    if (!selectedProject) return;

    try {
      const res = await TaskApi.getAllTasks({
        filter: {
          projectName: selectedProject,
          ...(selectedMember && { assignee: selectedMember }),
          ...(milestoneId && { milestone: milestoneId })
        },
      });
      setBoardTasks(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    if (dontShowAgain) {
      localStorage.setItem("dontShowInProgressToast", "true");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
        await TaskApi.taskLogs(taskId, { status: newStatus });
        return true;
    } catch (error) {
        console.error("Failed to update task status:", error);
        toast.error(error.response?.data?.message || "Failed to update task status");
        return false;
    }
  };

  const scrollToColumn = (columnId) => {
    if (!scrollContainerRef.current) {
      console.warn('scroll container ref missing');
      return;
    }
    const col = scrollContainerRef.current.querySelector(
      `[data-column-id="${columnId}"]`
    );
    if (col) {
      col.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const colLeft = col.offsetLeft;
        const colRight = colLeft + col.offsetWidth;
        if (container.scrollLeft > colLeft || container.scrollLeft + container.clientWidth < colRight) {
          container.scrollTo({ left: colLeft, behavior: 'smooth' });
        }
      }, 100);
    } else {
      console.warn('column element not found for', columnId);
    }
  };

  const handleDragEnd = async (result) => {
    setIsDragging(false);
    const { source, destination, type } = result;
    if (type === "column") return;
    if (!destination || source.droppableId === destination.droppableId) return;

    if (!sprintStarted && !isManager && !isAdmin && source.droppableId !== "backlog") {
        toast.error("You cannot change task status before the sprint has started.");
        return;
    }
    
    // Allow Managers and Admins to move anywhere.
    // Employees (assigned users) can move tasks if they are assigned?
    // The previous logic had `!isManager && source.droppableId === "done"`.
    // We should probably allow employees to move things too, as long as it's their task?
    // But `Board.jsx` doesn't know if the task is assigned to currentUser easily unless we check.
    // However, the `taskToMove` object has `assignee`.
    
    // For now, restore original logic + Employee capability?
    // User said: "only employee see the sprints" (and tasks).
    // User wants "assigned tasks" visible.
    // User implied they can drag and drop.
    
    if (!isManager && !isAdmin && source.droppableId === "done") {
       // Maybe employees can't move FROM done?
       return; 
    }

    const sourceColumn = groupedTasks.find(col => col.id === source.droppableId);
    const destinationColumn = groupedTasks.find(col => col.id === destination.droppableId);
    const allAvailableTasks = tasks || sortedBoardTasks;
    const taskToMove = allAvailableTasks.find(task => task._id.toString() === result.draggableId);

    if (!taskToMove) return;

    // Strict drop validations for the new split columns
    if (taskToMove.parentTask && destinationColumn.id === "todo-parent") {
       return; // Subtasks cannot be dropped in Parent column
    }
    if (!taskToMove.parentTask && destinationColumn.id === "todo-subtask") {
       return; // Parent tasks cannot be dropped in Subtask column
    }

    const inProgressTasks = groupedTasks.find(col => col.id === "inprogress")?.tasks || [];

    // ENFORCE ONLY 1 IN PROGRESS TASK GLOBALLY FOR THIS USER/BOARD
    if (destinationColumn.id === "inprogress" && taskToMove.status !== "inprogress") {
      if (inProgressTasks.length >= 1) {
        if (dontShowAgain && inProgressTasks[0]) {
          await handleAutoMoveToInProgress(inProgressTasks[0], taskToMove);
        } else {
          setTaskInProgress(inProgressTasks[0]);
          setTaskToMove(taskToMove);
          setShowToast(true);
          return;
        }
     } else {
         // Automatically start the timer context
         const durationMins = (taskToMove.backlogEstimatedHours ? taskToMove.backlogEstimatedHours * 60 : (taskToMove.estimatedHours ? taskToMove.estimatedHours * 60 : 25));
         const spentMins = taskToMove.duration?.inprogress || 0;
         const accumulatedSecs = spentMins * 60;
         
         const isTaskBacklog = taskToMove.status === 'backlog' || (taskToMove.taskDueDate && moment(taskToMove.taskDueDate).isBefore(moment(), 'day'));
         
         const focusTimerBinding = {
             taskId: taskToMove._id,
             taskName: taskToMove.taskName,
             taskIdString: taskToMove.taskId,
             estimatedHours: taskToMove.backlogEstimatedHours || taskToMove.estimatedHours || 0,
             dueDate: taskToMove.taskDueDate,
             isBacklog: isTaskBacklog
         };
         localStorage.setItem("focus_timer_task_binding", JSON.stringify(focusTimerBinding));
         
         const state = {
            timeLeft: Math.max((durationMins * 60) - accumulatedSecs, 0),
            isActive: true,
            startTime: new Date().toISOString(),
            accumulatedTime: accumulatedSecs,
            selectedDuration: durationMins,
            currentTheme: { name: 'Indigo', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.05)', shadow: 'rgba(79, 70, 229, 0.4)' }
         };
         localStorage.setItem("focus_timer_state", JSON.stringify(state));
         
         if (Math.round(spentMins) > 0) {
            toast.success(`Focus timer resumed at ${Math.round(spentMins)}m spent!`);
         } else {
            toast.success(`Focus timer started for ${taskToMove.taskName}!`);
         }
      }
    }

    // Optimistic Update
    const oldStatus = taskToMove.status;
    const newStatus = destinationColumn.id.startsWith("todo") ? "todo" : destinationColumn.id;
    
    // Stop the timer automatically if moved out of inprogress
    if (oldStatus === "inprogress" && newStatus !== "inprogress") {
      const bindingObjStr = localStorage.getItem("focus_timer_task_binding");
      if (bindingObjStr) {
         const bindingObj = JSON.parse(bindingObjStr);
         if (bindingObj.taskId === taskToMove._id) {
             const timerStateStr = localStorage.getItem("focus_timer_state");
             if (timerStateStr) {
                 const timerState = JSON.parse(timerStateStr);
                 if (timerState.isActive) {
                     const startTime = new Date(timerState.startTime);
                     const endTime = new Date();
                     const durationSecs = (timerState.accumulatedTime || 0) + Math.floor((endTime - startTime) / 1000);
                     const actualDuration = Math.max(Math.round(durationSecs / 60), 1); 
                     
                      const sData = {
                          date: new Date().toISOString().split('T')[0],
                          startTime: timerState.startTime,
                          endTime: endTime.toISOString(),
                          duration: actualDuration,
                          type: "Focus",
                          task: bindingObj.taskId,
                          taskName: bindingObj.isBacklog ? `${bindingObj.taskName} (Backlog)` : bindingObj.taskName,
                          taskIdString: bindingObj.taskIdString,
                          statusAtCompletion: newStatus,
                          completionState: newStatus === "done" ? "completed" : "incompleted",
                          estimatedTimeAtStart: timerState.selectedDuration,
                          isBacklog: !!bindingObj.isBacklog,
                          originalDueDate: bindingObj.dueDate
                      };
                      
                      FocusApi.createSession(sData).catch(e => console.error(e));
                     localStorage.removeItem("focus_timer_task_binding");
                     localStorage.removeItem("focus_timer_state");
                     localStorage.removeItem("focus_timer_retrievable"); // prevent undo context conflicts out of boundary
                     
                     toast.success(`Session automatically logged as ${newStatus === "done" ? "completed" : "incompleted"}!`);
                 }
             }
         }
      }
    }

    if (newStatus === "done") {
        setIsDoneReorganized(false);
        if (reorganizeTimerRef.current) clearTimeout(reorganizeTimerRef.current);
        reorganizeTimerRef.current = setTimeout(() => {
            setIsDoneReorganized(true);
        }, 5000);
    }

    // 1. Update UI immediately
    const updateTasksState = (prevTasks) => {
      const updatedTasks = prevTasks.map(task =>
        task._id === taskToMove._id
          ? { ...task, status: newStatus }
          : task
      );

      // If moved to 'done' or from 'done', and has a parent, update parent progress locally
      if (taskToMove.parentTask && (newStatus === 'done' || oldStatus === 'done')) {
        const parentId = typeof taskToMove.parentTask === 'object' ? taskToMove.parentTask._id : taskToMove.parentTask;
        
        // Find all subtasks of this parent in the CURRENT updated list
        const subtasks = updatedTasks.filter(t => {
            const pid = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
            return pid === parentId;
        });

        const total = subtasks.length;
        const completed = subtasks.filter(t => t.status === 'done').length;
        
        return updatedTasks.map(t => 
            t._id === parentId 
                ? { ...t, subtaskStats: { total, completed }, progress: Math.round((completed / total) * 100) } 
                : t
        );
      }

      return updatedTasks;
    };

    if (setTasks) setTasks(updateTasksState);
    setBoardTasks(updateTasksState);

    // scroll into view for the destination column (auto scroll)
    scrollToColumn(destinationColumn.id);

    // 2. Call API
    const success = await updateTaskStatus(taskToMove._id, newStatus);
    
    if (!success) {
      // Revert on failure
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskToMove._id
            ? { ...task, status: oldStatus }
            : task
        )
      );
    }
  };

  const handleAutoMoveToInProgress = async (currentInProgressTask, newTask) => {
    
    // Evaluate if there is an active timer to stop for currentInProgressTask
    const bindingObjStr = localStorage.getItem("focus_timer_task_binding");
    if (bindingObjStr) {
       const bindingObj = JSON.parse(bindingObjStr);
       if (bindingObj.taskId === currentInProgressTask._id) {
           const timerStateStr = localStorage.getItem("focus_timer_state");
           if (timerStateStr) {
               const timerState = JSON.parse(timerStateStr);
               if (timerState.isActive) {
                   const startTime = new Date(timerState.startTime);
                   const endTime = new Date();
                   const durationSecs = (timerState.accumulatedTime || 0) + Math.floor((endTime - startTime) / 1000);
                   const actualDuration = Math.max(Math.round(durationSecs / 60), 1); 
                   
                   const sessionData = {
                       date: new Date().toISOString().split('T')[0],
                       startTime: timerState.startTime,
                       endTime: endTime.toISOString(),
                       duration: actualDuration,
                       type: "Focus",
                       task: bindingObj.taskId,
                       taskName: bindingObj.taskName,
                       taskIdString: bindingObj.taskIdString,
                       statusAtCompletion: "hold",
                       completionState: "incompleted",
                       estimatedTimeAtStart: timerState.selectedDuration
                   };
                   
                   FocusApi.createSession(sessionData).catch(e => console.error(e));
                   localStorage.removeItem("focus_timer_task_binding");
                   localStorage.removeItem("focus_timer_state");
               }
           }
       }
    }

    // Start timer for newTask automatically
    const durationMins = (newTask.backlogEstimatedHours ? newTask.backlogEstimatedHours * 60 : (newTask.estimatedHours ? newTask.estimatedHours * 60 : 25));
    const spentMins = newTask.duration?.inprogress || 0;
    const accumulatedSecs = spentMins * 60;
    
    const isTaskBacklog = newTask.status === 'backlog' || (newTask.taskDueDate && moment(newTask.taskDueDate).isBefore(moment(), 'day'));

    const focusTimerBinding = {
       taskId: newTask._id,
       taskName: newTask.taskName,
       taskIdString: newTask.taskId,
       estimatedHours: newTask.backlogEstimatedHours || newTask.estimatedHours || 0,
       dueDate: newTask.taskDueDate,
       isBacklog: isTaskBacklog
    };
    localStorage.setItem("focus_timer_task_binding", JSON.stringify(focusTimerBinding));
    
    const state = {
       timeLeft: Math.max((durationMins * 60) - accumulatedSecs, 0),
       isActive: true,
       startTime: new Date().toISOString(),
       accumulatedTime: accumulatedSecs,
       selectedDuration: durationMins,
       currentTheme: { name: 'Indigo', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.05)', shadow: 'rgba(79, 70, 229, 0.4)' }
    };
    localStorage.setItem("focus_timer_state", JSON.stringify(state));
    
    if (Math.round(spentMins) > 0) {
        toast.success(`Timer logged for held task. Automatically resumed for ${newTask.taskName} at ${Math.round(spentMins)}m spent!`);
    } else {
        toast.success(`Timer logged for held task. Started for ${newTask.taskName}!`);
    }

    await Promise.all([
      updateTaskStatus(currentInProgressTask._id, "hold"),
      updateTaskStatus(newTask._id, "inprogress")
    ]);

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === currentInProgressTask._id
          ? { ...task, status: "hold" }
          : task._id === newTask._id
            ? { ...task, status: "inprogress" }
            : task
      )
    );
     // fetchTasks(); 
  };

  // scroll horizontally while dragging if pointer near edges
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { left, right } = container.getBoundingClientRect();
      const threshold = 80;
      const delta = 30;
      if (e.clientX > right - threshold) {
        container.scrollBy({ left: delta, behavior: 'smooth' });
      } else if (e.clientX < left + threshold) {
        container.scrollBy({ left: -delta, behavior: 'smooth' });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  const handleToastAction = async (shouldMove) => {
    if (shouldMove && taskToMove && taskInProgress) {
      await handleAutoMoveToInProgress(taskInProgress, taskToMove);
    }
    handleToastClose();
  };

  const handleCardClick = (task) => {
    setSelectedTaskForDrawer(task);
    setIsDrawerOpen(true);
  };

  const handleEditFromDrawer = (task) => {
    setIsDrawerOpen(false);
    if (handleClick) {
      handleClick(task); // Trigger original handleClick (Backward compatibility for MyTask form)
    } else {
      setEditTaskId(task._id);
      setEditTaskData(task);
    }
  };

  return (
    <div className="board-container flex-1 min-h-0 flex flex-col w-full relative">
      
      {/* Global Board Header Filter */}
      {uniqueParents.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-borderLight flex-shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Subtasks:</span>
              <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-1.5 text-xs w-[200px] focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                  <option value="">All Parent Tasks</option>
                  {uniqueParents.map(parent => (
                      <option key={parent._id} value={parent._id}>
                          {parent.taskName}
                      </option>
                  ))}
              </select>
          </div>
      )}



      <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
        <div 
            className="flex-1 min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2" 
            ref={scrollContainerRef}
        >
            <div className="flex flex-nowrap items-start h-full px-2 w-max min-w-full">
            {groupedTasks.map((column) => (
                <div
                key={column.id}
                data-column-id={column.id}
                className="column shrink-0 px-3 w-[360px] sm:w-[380px] md:w-[420px] lg:w-[460px] h-full flex flex-col min-h-0"
                >
                <Column 
                  column={column} 
                  handleClick={handleCardClick} 
                  isDoneColumn={column.id === "done"}
                  expandedParents={expandedParents}
                  setExpandedParents={setExpandedParents}
                />
                </div>            ))}
            </div>
        </div>
      </DragDropContext>

      <TaskDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        task={selectedTaskForDrawer} 
        canEdit={canEdit}
        onTaskUpdate={handleEditFromDrawer}
      />

      {showToast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-black p-4 rounded-md shadow-lg flex items-center space-x-4 z-50">
          <div>
            <p className="font-semibold">
              There's already a task in 'In Progress'. Move it to 'Hold'?
            </p>
            <p>This will allow your task to be moved to 'In Progress'.</p>
          </div>
          <div className="ml-4 space-y-2">
            <div className="flex items-center space-x-2">
               <button
                onClick={() => handleToastAction(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Yes
              </button>
              <button
                onClick={() => handleToastAction(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => {
                  setDontShowAgain(e.target.checked);
                  localStorage.setItem("dontShowInProgressToast", e.target.checked.toString());
                }}
                className="rounded"
              />
              <label htmlFor="dontShowAgain" className="text-sm">
                Don't show me again
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing task automatically handled directly inside Board.jsx */}
      {editTaskId && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setEditTaskId(null); setEditTaskData([]); }} />
          <div className="relative w-full max-w-4xl h-[90vh] overflow-auto bg-white dark:bg-themeBG rounded-2xl shadow-2xl z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-bold">Update Task</h4>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => { setEditTaskId(null); setEditTaskData([]); }}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <CreateTask 
                modalMode={true} 
                task={editTaskData} 
                id={editTaskId} 
                setId={setEditTaskId} 
                setTask={setEditTaskData} 
                setProjectTasks={setTasks} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;