import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Column from "./Column";
import { TaskApi } from "../../services/api/Task.api";
import { useSelector } from "react-redux";

const Board = ({
  tasks,
  setTasks,
  selectedProject,
  handleClick,
  selectedMember,
  milestoneId
}) => {
  const [showToast, setShowToast] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [taskInProgress, setTaskInProgress] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(
    localStorage.getItem("dontShowInProgressToast") === "true"
  );

  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";

  const columns = [
    { id: "todo", name: "To Do" },
    { id: "inprogress", name: "In Progress" },
    { id: "done", name: "Done" },
    { id: "hold", name: "Hold" },
  ];

  const groupedTasks = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.id),
  }));

  const fetchTasks = async () => {
    if (!selectedProject) return;

    try {
      const res = await TaskApi.getAllTasks({
        filter: {
          projectName: selectedProject,
          ...(selectedMember && { assignee: selectedMember }),
          ...(milestoneId && { milestone: milestoneId })
        },
      });
      setTasks(res.data?.data || []);
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
      return false;
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    if (!isManager && source.droppableId === "done") {
      return;
    }

    const sourceColumn = groupedTasks.find(col => col.id === source.droppableId);
    const destinationColumn = groupedTasks.find(col => col.id === destination.droppableId);
    const taskToMove = tasks.find(task => task._id === result.draggableId);

    if (!taskToMove) return;

    // Check for in-progress task limitation for non-managers
    if (!isManager && destinationColumn.id === "inprogress") {
      const inProgressTasks = groupedTasks.find(col => col.id === "inprogress")?.tasks || [];

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

    const success = await updateTaskStatus(taskToMove._id, destinationColumn.id);
    if (success) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskToMove._id
            ? { ...task, status: destinationColumn.id }
            : task
        )
      );
      fetchTasks();
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
    fetchTasks();
  };

  const handleToastAction = async (shouldMove) => {
    if (shouldMove && taskToMove && taskInProgress) {
      await handleAutoMoveToInProgress(taskInProgress, taskToMove);
    }
    handleToastClose();
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-2">
          {groupedTasks.map((column) => (
            <Droppable
              key={column.id}
              droppableId={column.id}
              direction="vertical"
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="column"
                >
                  <Column column={column} handleClick={handleClick} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

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