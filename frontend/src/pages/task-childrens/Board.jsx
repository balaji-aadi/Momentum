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
import { IoClose, IoCalendarOutline } from "react-icons/io5";
import { getScopedItem, setScopedItem, removeScopedItem } from "../../utils/userStorage";

const Board = ({
  tasks,
  setTasks,
  selectedProject,
  handleClick,
  selectedMember,
  milestoneId,
  sprintStarted = true, // Default to true for non-sprint boards
  onOpenSchedule
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

  // Release from Hold Modal State
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseTask, setReleaseTask] = useState(null);
  const [releaseChildren, setReleaseChildren] = useState([]);
  const [releaseDates, setReleaseDates] = useState({}); // { [taskId]: { taskStartDate, taskDueDate } }
  const [releaseDestination, setReleaseDestination] = useState("todo");

  const handleOpenReleaseModal = (task, destinationStatus = "todo") => {
      setReleaseTask(task);
      setReleaseDestination(destinationStatus);
      
      // Get all child tasks that are currently on Hold
      const childTasks = (tasks || sortedBoardTasks).filter(t => {
          const pid = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
          return pid && pid.toString() === task._id.toString() && t.status === 'hold';
      });
      setReleaseChildren(childTasks);

      // Initialize dates
      const todayStr = moment().format("YYYY-MM-DD");
      const tomorrowStr = moment().add(1, 'day').format("YYYY-MM-DD");
      
      const datesObj = {
          [task._id]: {
              taskStartDate: task.taskStartDate ? moment(task.taskStartDate).format("YYYY-MM-DD") : todayStr,
              taskDueDate: task.taskDueDate ? moment(task.taskDueDate).format("YYYY-MM-DD") : tomorrowStr
          }
      };

      childTasks.forEach(child => {
          datesObj[child._id] = {
              taskStartDate: child.taskStartDate ? moment(child.taskStartDate).format("YYYY-MM-DD") : todayStr,
              taskDueDate: child.taskDueDate ? moment(child.taskDueDate).format("YYYY-MM-DD") : tomorrowStr
          };
      });

      setReleaseDates(datesObj);
      setShowReleaseModal(true);
  };

  const handleApplyParentDatesToChildren = () => {
      const parentDates = releaseDates[releaseTask._id];
      const updatedDatesObj = { ...releaseDates };
      releaseChildren.forEach(child => {
          updatedDatesObj[child._id] = {
              taskStartDate: parentDates.taskStartDate,
              taskDueDate: parentDates.taskDueDate
          };
      });
      setReleaseDates(updatedDatesObj);
      toast.success("Applied parent task dates to all subtasks!");
  };

  const stopActiveTimerIfMatching = (targetTaskId, associatedChildIds = []) => {
     const bindingObjStr = getScopedItem("focus_timer_task_binding");
     if (bindingObjStr) {
        const bindingObj = JSON.parse(bindingObjStr);
        const activeTaskId = bindingObj.taskId;
        if (activeTaskId === targetTaskId || associatedChildIds.includes(activeTaskId)) {
            const timerStateStr = getScopedItem("focus_timer_state");
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
                         statusAtCompletion: "hold",
                         completionState: "incompleted",
                         estimatedTimeAtStart: timerState.selectedDuration,
                         isBacklog: !!bindingObj.isBacklog,
                         originalDueDate: bindingObj.dueDate
                     };
                     
                     FocusApi.createSession(sData).catch(e => console.error(e));
                     removeScopedItem("focus_timer_task_binding");
                     removeScopedItem("focus_timer_state");
                     removeScopedItem("focus_timer_retrievable");
                     
                     toast.success("Timer paused and logged. Task was put on hold!");
                }
            }
        }
     }
  };

  const handleReleaseSubmit = async () => {
      // Validate dates
      const parentDates = releaseDates[releaseTask._id];
      const pStart = moment(parentDates.taskStartDate).startOf('day');
      const pDue = moment(parentDates.taskDueDate).endOf('day');

      if (pDue.isBefore(pStart)) {
          toast.error("Parent task due date cannot be before its start date.");
          return;
      }

      for (const child of releaseChildren) {
          const cDates = releaseDates[child._id];
          const cStart = moment(cDates.taskStartDate).startOf('day');
          const cDue = moment(cDates.taskDueDate).endOf('day');

          if (cDue.isBefore(cStart)) {
              toast.error(`Subtask "${child.taskName}" due date cannot be before its start date.`);
              return;
          }

          if (cStart.isBefore(pStart)) {
              toast.error(`Subtask "${child.taskName}" start date cannot be before parent task start date (${pStart.format("DD/MM/YYYY")}).`);
              return;
          }

          if (cDue.isAfter(pDue)) {
              toast.error(`Subtask "${child.taskName}" due date cannot be after parent task due date (${pDue.format("DD/MM/YYYY")}).`);
              return;
          }
      }

      setShowReleaseModal(false);
      const loadingToast = toast.loading("Updating dates and status...");

      try {
          // 1. Update Parent task first in backend
          const parentPayload = {
              taskStartDate: releaseDates[releaseTask._id].taskStartDate,
              taskDueDate: releaseDates[releaseTask._id].taskDueDate,
              status: releaseDestination,
              holdDate: null
          };
          
          await TaskApi.updateTask(releaseTask._id, parentPayload);
          
          // 2. Update Child tasks in backend
          for (const child of releaseChildren) {
              const childPayload = {
                  taskStartDate: releaseDates[child._id].taskStartDate,
                  taskDueDate: releaseDates[child._id].taskDueDate,
                  status: releaseDestination
              };
              await TaskApi.updateTask(child._id, childPayload);
          }

          // 3. Optimistic local state update
          const updatedIds = [releaseTask._id, ...releaseChildren.map(c => c._id)];
          const updateTasksState = (prevTasks) => {
              return prevTasks.map(t => {
                  if (updatedIds.includes(t._id)) {
                      const newDates = releaseDates[t._id];
                      return {
                          ...t,
                          status: releaseDestination,
                          taskStartDate: newDates.taskStartDate,
                          taskDueDate: newDates.taskDueDate,
                          holdDate: null
                      };
                  }
                  return t;
              });
          };

          if (setTasks) setTasks(updateTasksState);
          setBoardTasks(updateTasksState);

          toast.dismiss(loadingToast);
          toast.success("Tasks released from hold successfully!");
      } catch (err) {
          toast.dismiss(loadingToast);
          console.error("Failed to release tasks from hold:", err);
          toast.error(err.response?.data?.message || "Failed to release tasks from hold");
          fetchTasks(); // Reload to sync
      }
  };

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
            const parent = boardTasks.find(pt => pt._id?.toString() === pId?.toString());
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
      if (task.status === 'inprogress') return false;
      if (task.status === 'hold') return false;

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

  const parentTasksOnly = nonBacklogTasks.filter((t) => !t.parentTask && (selectedParentId ? t._id?.toString() === selectedParentId.toString() : true));
  const allSubtasks = nonBacklogTasks.filter((t) => t.parentTask);
  const allSubtasksInBoard = sortedBoardTasks.filter((t) => t.parentTask);

  const matchesStatus = (taskStatus, target) => {
    if (!taskStatus) return false;
    const s = taskStatus.toString().toLowerCase();
    if (target === 'done') return s === 'done' || s === 'completed';
    if (target === 'inprogress') return s === 'inprogress' || s === 'in progress' || s === 'in_progress';
    if (target === 'todo') return s === 'todo' || s === 'to do' || s === 'to_do';
    if (target === 'hold') return s === 'hold' || s === 'on hold' || s === 'on_hold';
    if (target === 'backlog') return s === 'backlog';
    return s === target.toLowerCase();
  };

  // Derive unique Parent Tasks dynamically from all subtasks available
  const uniqueParents = Array.from(new Set(allSubtasksInBoard.map(t => {
      const pid = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
      return pid ? pid.toString() : null;
  }).filter(Boolean)))
      .map(id => {
          const sample = allSubtasksInBoard.find(t => {
              const pid = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
              return pid && pid.toString() === id;
          });
          if (sample && typeof sample.parentTask === 'object') {
              return sample.parentTask;
          }
          // If it's a string ID, try finding it in all board tasks
          return sortedBoardTasks.find(t => t._id?.toString() === id);
      }).filter(Boolean);

  // Group parent tasks by their standard Status columns
  const groupedTasks = columns.map((column) => {
    let combinedTasks = [];

    if (column.id === "backlog") {
      combinedTasks = selectedParentId 
        ? backlogTasks.filter(t => {
            const pId = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
            return (t._id?.toString() === selectedParentId.toString()) || (pId && pId.toString() === selectedParentId.toString());
          })
        : backlogTasks;
    } else if (column.id === "todo-parent") {
      combinedTasks = parentTasksOnly.filter((task) => matchesStatus(task.status, "todo"));
    } else if (column.id === "todo-subtask") {
      const filteredSubtasks = selectedParentId
        ? allSubtasks.filter(
            (t) => {
              const pid = typeof t.parentTask === "object" ? t.parentTask?._id : t.parentTask;
              return pid && pid.toString() === selectedParentId.toString();
            }
          )
        : allSubtasks;
      combinedTasks = filteredSubtasks.filter((task) => matchesStatus(task.status, "todo"));
    } else if (column.id === "done") {
        let doneTasks = sortedBoardTasks.filter(t => matchesStatus(t.status, "done"));
        
        if (selectedParentId) {
            doneTasks = doneTasks.filter(t => {
                const pId = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
                return (t._id?.toString() === selectedParentId.toString()) || (pId && pId.toString() === selectedParentId.toString());
            });
        }
        
        if (!isDoneReorganized) {
            combinedTasks = doneTasks;
        } else {
            // Group subtasks under their parents if both are done
            const doneParents = doneTasks.filter(t => !t.parentTask);
            const doneChildren = doneTasks.filter(t => t.parentTask);
            
            const processedParents = doneParents.map(parent => {
                const nestedChildren = doneChildren.filter(child => {
                    const pId = typeof child.parentTask === 'object' ? child.parentTask._id : child.parentTask;
                    return pId && pId.toString() === parent._id.toString();
                });
                
                const finishDate = parent.activityLogs?.find(log => matchesStatus(log.currentStatus, 'done'))?.date || parent.updatedAt;
                
                return {
                    ...parent,
                    isDoneGroup: true,
                    nestedChildren,
                    actualFinishDate: finishDate
                };
            });
            
            const orphanDoneChildren = doneChildren.filter(child => {
                const pId = typeof child.parentTask === 'object' ? child.parentTask._id : child.parentTask;
                return !doneParents.find(p => p._id?.toString() === pId?.toString());
            });
            
            // Sort parents by actual finish date (Oldest top, Newest bottom)
            processedParents.sort((a, b) => new Date(a.actualFinishDate) - new Date(b.actualFinishDate));
            
            combinedTasks = [...processedParents, ...orphanDoneChildren];
        }
    } else {
      const filteredSubtasks = selectedParentId
        ? allSubtasks.filter(
            (t) => {
              const pid = typeof t.parentTask === "object" ? t.parentTask?._id : t.parentTask;
              return pid && pid.toString() === selectedParentId.toString();
            }
          )
        : allSubtasks;

      combinedTasks = [
        ...parentTasksOnly.filter((task) => matchesStatus(task.status, column.id)),
        ...filteredSubtasks.filter((task) => matchesStatus(task.status, column.id)),
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

    // Intercept drag out of Hold to display date assignment modal
    if (source.droppableId === "hold") {
        const destStatus = destinationColumn.id.startsWith("todo") ? "todo" : destinationColumn.id;
        handleOpenReleaseModal(taskToMove, destStatus);
        return;
    }

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
          const isAiChallenge = taskToMove.taskType === "AI Challenge";
          const durationMins = isAiChallenge ? 40 : (taskToMove.backlogEstimatedHours ? taskToMove.backlogEstimatedHours * 60 : (taskToMove.estimatedHours ? taskToMove.estimatedHours * 60 : 25));
          const isTaskBacklog = taskToMove.status === 'backlog' || (taskToMove.taskDueDate && moment(taskToMove.taskDueDate).isBefore(moment(), 'day') && taskToMove.status !== 'done' && taskToMove.status !== 'inprogress' && taskToMove.status !== 'hold');
          const spentMins = isTaskBacklog ? 0 : (taskToMove.duration?.inprogress || 0);
          const accumulatedSecs = spentMins * 60;
          
          const focusTimerBinding = {
              taskId: taskToMove._id,
              taskName: taskToMove.taskName,
              taskIdString: taskToMove.taskId,
              estimatedHours: isAiChallenge ? (40 / 60) : (taskToMove.backlogEstimatedHours || taskToMove.estimatedHours || 0),
              dueDate: taskToMove.taskDueDate,
              isBacklog: isTaskBacklog,
              taskType: taskToMove.taskType
          };
         setScopedItem("focus_timer_task_binding", focusTimerBinding);
         
         const state = {
            timeLeft: Math.max((durationMins * 60) - accumulatedSecs, 0),
            isActive: true,
            startTime: new Date().toISOString(),
            accumulatedTime: accumulatedSecs,
            selectedDuration: durationMins,
            currentTheme: { name: 'Vermilion', color: '#E34234', bg: 'rgba(227, 66, 52, 0.05)', shadow: 'rgba(227, 66, 52, 0.4)' }
         };
         setScopedItem("focus_timer_state", state);
         
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
    
    // Stop the timer automatically if moved out of inprogress / hold
    if (newStatus === "hold") {
        const childIds = !taskToMove.parentTask 
            ? (tasks || sortedBoardTasks)
                .filter(t => {
                    const pid = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
                    return pid === taskToMove._id;
                })
                .map(t => t._id)
            : [];
        stopActiveTimerIfMatching(taskToMove._id, childIds);
    }
    
    // Stop the timer automatically if moved out of inprogress
    if (oldStatus === "inprogress" && newStatus !== "inprogress") {
      const bindingObjStr = getScopedItem("focus_timer_task_binding");
      if (bindingObjStr) {
         const bindingObj = JSON.parse(bindingObjStr);
         if (bindingObj.taskId === taskToMove._id) {
             const timerStateStr = getScopedItem("focus_timer_state");
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
                     removeScopedItem("focus_timer_task_binding");
                     removeScopedItem("focus_timer_state");
                     removeScopedItem("focus_timer_retrievable"); // prevent undo context conflicts out of boundary
                     
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
      let updatedTasks = prevTasks.map(task =>
        task._id === taskToMove._id
          ? { ...task, status: newStatus, ...(newStatus === 'hold' ? { holdDate: new Date() } : { holdDate: null }) }
          : task
      );

      // If parent is put on hold, cascade to non-completed children in local state
      if (!taskToMove.parentTask && newStatus === 'hold') {
         updatedTasks = updatedTasks.map(task => {
             const pid = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
             if (pid === taskToMove._id && task.status !== 'done') {
                 return { ...task, status: 'hold' };
             }
             return task;
         });
      }

      // If parent is moved OUT of hold, release held children to todo in local state
      if (!taskToMove.parentTask && oldStatus === 'hold' && newStatus !== 'hold') {
         updatedTasks = updatedTasks.map(task => {
             const pid = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
             if (pid === taskToMove._id && task.status === 'hold') {
                 return { ...task, status: 'todo' };
             }
             return task;
         });
      }

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
    const bindingObjStr = getScopedItem("focus_timer_task_binding");
    if (bindingObjStr) {
       const bindingObj = JSON.parse(bindingObjStr);
       if (bindingObj.taskId === currentInProgressTask._id) {
           const timerStateStr = getScopedItem("focus_timer_state");
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
                   removeScopedItem("focus_timer_task_binding");
                   removeScopedItem("focus_timer_state");
               }
           }
       }
    }

    // Start timer for newTask automatically
    const isTaskBacklog = newTask.status === 'backlog' || (newTask.taskDueDate && moment(newTask.taskDueDate).isBefore(moment(), 'day') && newTask.status !== 'done' && newTask.status !== 'inprogress' && newTask.status !== 'hold');
    const durationMins = (newTask.backlogEstimatedHours ? newTask.backlogEstimatedHours * 60 : (newTask.estimatedHours ? newTask.estimatedHours * 60 : 25));
    const spentMins = isTaskBacklog ? 0 : (newTask.duration?.inprogress || 0);
    const accumulatedSecs = spentMins * 60;
    
    const focusTimerBinding = {
       taskId: newTask._id,
       taskName: newTask.taskName,
       taskIdString: newTask.taskId,
       estimatedHours: newTask.backlogEstimatedHours || newTask.estimatedHours || 0,
       dueDate: newTask.taskDueDate,
       isBacklog: isTaskBacklog
    };
    setScopedItem("focus_timer_task_binding", focusTimerBinding);
    
    const state = {
       timeLeft: Math.max((durationMins * 60) - accumulatedSecs, 0),
       isActive: true,
       startTime: new Date().toISOString(),
       accumulatedTime: accumulatedSecs,
       selectedDuration: durationMins,
       currentTheme: { name: 'Vermilion', color: '#E34234', bg: 'rgba(227, 66, 52, 0.05)', shadow: 'rgba(227, 66, 52, 0.4)' }
    };
    setScopedItem("focus_timer_state", state);
    
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



      {/* Unscheduled Arena Notification Banner */}
      {onOpenSchedule && sortedBoardTasks?.length > 0 && !sortedBoardTasks.some(t => t.taskStartDate || t.taskDueDate) && (
        <div className="mx-4 my-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/70 dark:border-indigo-800/40 rounded-xl flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
              <IoCalendarOutline size={16} />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Arena Not Scheduled
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Set your daily study pace, topic revision buffers, and target timeline.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSchedule}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <IoCalendarOutline size={13} />
            <span>Schedule Arena</span>
          </button>
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
                  onReleaseHold={handleOpenReleaseModal}
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
      {/* Release from Hold Modal */}
      {showReleaseModal && releaseTask && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReleaseModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-2xl flex flex-col gap-5 border border-slate-100 dark:border-slate-700/50 max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Release Task from Hold
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Assign new timelines for the parent and nested items to resume work.
                </p>
              </div>
              <button 
                onClick={() => setShowReleaseModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors"
              >
                <IoClose size={18} />
              </button>
            </div>

            {/* Task list and date pickers */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 py-2 custom-scrollbar">
              
              {/* Parent Task Card */}
              <div className="p-4 rounded-2xl bg-vermilion-50/50 dark:bg-vermilion-950/20 border border-vermilion-100/50 dark:border-vermilion-900/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-vermilion-100 dark:bg-vermilion-900/50 text-primary dark:text-vermilion-300 px-2 py-0.5 rounded-md">
                    Parent Task
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {releaseTask.taskId}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {releaseTask.taskName}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                      New Start Date
                    </label>
                    <input 
                      type="date"
                      value={releaseDates[releaseTask._id]?.taskStartDate || ""}
                      onChange={(e) => {
                        setReleaseDates(prev => ({
                          ...prev,
                          [releaseTask._id]: {
                            ...prev[releaseTask._id],
                            taskStartDate: e.target.value
                          }
                        }));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                      New Due Date
                    </label>
                    <input 
                      type="date"
                      value={releaseDates[releaseTask._id]?.taskDueDate || ""}
                      onChange={(e) => {
                        setReleaseDates(prev => ({
                          ...prev,
                          [releaseTask._id]: {
                            ...prev[releaseTask._id],
                            taskDueDate: e.target.value
                          }
                        }));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Subtasks Section */}
              {releaseChildren.length > 0 && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Held Subtasks ({releaseChildren.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyParentDatesToChildren}
                      className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider flex items-center gap-1.5 align-middle self-start"
                    >
                      <IoCalendarOutline size={13} />
                      Apply Parent Dates to all Subtasks
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {releaseChildren.map(child => (
                      <div key={child._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3 ml-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                            Subtask
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {child.taskId}
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {child.taskName}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                              New Start Date
                            </label>
                            <input 
                              type="date"
                              value={releaseDates[child._id]?.taskStartDate || ""}
                              onChange={(e) => {
                                setReleaseDates(prev => ({
                                  ...prev,
                                  [child._id]: {
                                    ...prev[child._id],
                                    taskStartDate: e.target.value
                                  }
                                }));
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                              New Due Date
                            </label>
                            <input 
                              type="date"
                              value={releaseDates[child._id]?.taskDueDate || ""}
                              onChange={(e) => {
                                setReleaseDates(prev => ({
                                  ...prev,
                                  [child._id]: {
                                    ...prev[child._id],
                                    taskDueDate: e.target.value
                                  }
                                }));
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              
              {/* Destination status toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Move released to:
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReleaseDestination("todo")}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      releaseDestination === "todo" 
                        ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseDestination("inprogress")}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      releaseDestination === "inprogress"
                        ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    }`}
                  >
                    In Progress
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReleaseSubmit}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-primary hover:bg-primary/95 transition-all shadow-md active:scale-95"
                >
                  Save & Release Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile portrait orientation warning */}
      <div className="hidden max-md:portrait:flex fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex-col items-center justify-center p-6 text-center text-white font-sans animate-in fade-in duration-300">
          <style>{`
              @keyframes rotatePhone {
                  0%, 100% { transform: rotate(0deg); }
                  50% { transform: rotate(90deg); }
              }
              .animate-rotate-phone {
                  animation: rotatePhone 3s infinite ease-in-out;
              }
          `}</style>
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 animate-pulse">
              <svg className="w-12 h-12 text-primary animate-rotate-phone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* Phone rotation icon */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Rotate Your Device</h2>
          <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed mb-6">
              To get a professional, friendly and interactive view of the Kanban board, please rotate your device to landscape mode.
          </p>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
              Landscape Mode Recommended
          </span>
      </div>
    </div>
  );
};

export default Board;