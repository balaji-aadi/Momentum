import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Column from "./Column";
import { TaskApi } from "../../services/api/Task.api";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import TaskDetailDrawer from "./TaskDetailDrawer";

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

  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let scrollSpeed = 0;

    const handleMouseMove = (e) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const rect = scrollContainerRef.current.getBoundingClientRect();
      const { clientX } = e;
      const edgeThreshold = 150; 
      const maxSpeed = 20;

      if (clientX > rect.right - edgeThreshold) {
        const distance = Math.max(0, edgeThreshold - (rect.right - clientX));
        scrollSpeed = (distance / edgeThreshold) * maxSpeed;
      } else if (clientX < rect.left + edgeThreshold) {
        const distance = Math.max(0, edgeThreshold - (clientX - rect.left));
        scrollSpeed = -((distance / edgeThreshold) * maxSpeed);
      } else {
        scrollSpeed = 0;
      }
    };

    const scrollLoop = () => {
      if (isDragging && scrollSpeed !== 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += scrollSpeed;
      }
      if (isDragging) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      animationFrameId = requestAnimationFrame(scrollLoop);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging]);

  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  const isAdmin = currentUser?.userRole?.name === "admin";
  const canEdit = isManager || isAdmin;

  const [boardTasks, setBoardTasks] = useState([]);

  useEffect(() => {
    if (tasks) {
      setBoardTasks(tasks);
    } else {
        fetchTasks();
    }
  }, [tasks, selectedProject, selectedMember, milestoneId]);

  const columns = [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "To Do" },
    { id: "inprogress", name: "In Progress" },
    { id: "hold", name: "Hold" },
    { id: "review", name: "Review" },
    { id: "done", name: "Done" },
  ];

  const groupedTasks = columns.map((column) => ({
    ...column,
    tasks: boardTasks.filter((task) => task.status === column.id),
  }));

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

  const handleDragEnd = async (result) => {
    setIsDragging(false);
    const { source, destination, type } = result;
    if (type === "column") return;
    if (!destination || source.droppableId === destination.droppableId) return;

    if (!sprintStarted && !isManager && !isAdmin) {
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
    const taskToMove = tasks.find(task => task._id === result.draggableId);

    if (!taskToMove) return;

    // Check for in-progress task limitation for non-managers
    if (!isManager && !isAdmin && destinationColumn.id === "inprogress") {
      const inProgressTasks = groupedTasks.find(col => col.id === "inprogress")?.tasks || [];

      // Filter inProgress tasks for this user?
      // The requirement "one task in progress" usually applies per user.
      // But here it checks ALL tasks in progress?
      // Assuming this is per board view.
      
      if (inProgressTasks.length >= 1 && taskToMove.status !== "inprogress") {
        if (dontShowAgain) {
          // Auto-handle the case when "Don't show again" is checked
          await handleAutoMoveToInProgress(inProgressTasks[0], taskToMove);
        } else {
          setTaskInProgress(inProgressTasks[0]);
          setTaskToMove(taskToMove);
          setShowToast(true);
          return;
        }
      }
    }

    // Optimistic Update
    const oldStatus = taskToMove.status;
    const newStatus = destinationColumn.id;

    // 1. Update UI immediately
    setTasks(prevTasks => {
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
    });

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
    handleClick(task); // Trigger original handleClick (UpdateTask form)
  };

  return (
    <div className="board-container flex-1 min-h-0 flex flex-col w-full relative">
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
        <div 
          className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2" 
          data-rbd-scroll-container
          ref={scrollContainerRef}
        >
          <div className="flex flex-row items-start gap-4 sm:gap-6 lg:gap-8 h-full px-2 w-max min-w-full">
            {groupedTasks.map((column) => (
              <div
                key={column.id}
                className="column shrink-0 w-[85vw] sm:w-[300px] md:w-[320px] lg:w-[350px] h-full flex flex-col min-h-0"
              >
                <Column column={column} handleClick={handleCardClick} />
              </div>
            ))}
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
    </div>
  );
};

export default Board;