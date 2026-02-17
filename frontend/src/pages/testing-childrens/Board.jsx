// Testing board section

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import { useSelector } from "react-redux";
import { TestApi } from "../../services/api/Test.api";
import Column from "./Column";

const Board = ({
  tasks,
  setTasks,
  selectedProject,
  handleClick,
  selectedMember,
  selectedTaskType,
  milestoneId
}) => {
  const [showToast, setShowToast] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [taskInProgress, setTaskInProgress] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isBug, setIsBug] = useState(false);

  useEffect(() => {
    if (selectedTaskType === "Bug Reporting") {
      setIsBug(true);
    } else {
      setIsBug(false);
    }
  }, [selectedTaskType]);

  const { currentUser } = useSelector((state) => state.store);
  const [manager, setManager] = useState(
    currentUser?.userRole?.name === "projectmanager" ? true : false
  );

  const columns = [
    { id: "Not Executed", name: "Not Executed" },
    { id: "Pass", name: "Pass" },
    { id: "Fail", name: "Fail" },
  ];

  const bugColumns = [
    { id: "Open", name: "Open" },
    { id: "In Progress", name: "In Progress" },
    { id: "Resolved", name: "Resolved" },
    { id: "Closed", name: "Closed" },
  ];

  const groupedTasks = isBug
    ? bugColumns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.bugStatus === column.id),
    }))
    : columns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.testStatus === column.id),
    }));

  const fetchTasks = async () => {
    if (selectedProject) {
      const filter = {
        projectId: selectedProject,
        ...(selectedMember && { createdBy: selectedMember }),
        "milestone": milestoneId
      };

      try {
        const res = isBug
          ? await TestApi.getAllBugs(filter)
          : await TestApi.getAllTesting(filter);
        console.log(res.data);
        setTasks(res.data?.data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    if (dontShowAgain) {
      localStorage.setItem("dontShowInProgressToast", "true");
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      !manager &&
      source.droppableId === "done" &&
      !manager &&
      destination.droppableId !== "done"
    ) {
      return;
    }

    const sourceColumn = groupedTasks.find(
      (col) => col.id === source.droppableId
    );
    const destinationColumn = groupedTasks.find(
      (col) => col.id === destination.droppableId
    );

    // Only show the toast if moving a task into "In Progress" and there is already a task there
    if (!manager && destinationColumn.id === "inprogress") {
      const inProgressTasks = groupedTasks.find(
        (col) => col.id === "inprogress"
      )?.tasks;

      if (inProgressTasks && inProgressTasks.length >= 1) {
        const currentTaskInProgress = inProgressTasks[0];
        const taskToMove = tasks.find(
          (task) => task._id === result.draggableId
        );

        // Check if the task is already in the "In Progress" column
        if (taskToMove.status !== "inprogress") {
          setTaskInProgress(currentTaskInProgress);
          setTaskToMove(taskToMove);
          setShowToast(true);
          return;
        }
      }
    }

    if (sourceColumn === destinationColumn) {
      const updatedTasks = [...sourceColumn.tasks];
      const [movedTask] = updatedTasks.splice(source.index, 1);
      updatedTasks.splice(destination.index, 0, movedTask);

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === movedTask._id
            ? { ...task, status: sourceColumn.id }
            : task
        )
      );
    } else {
      const sourceTasks = [...sourceColumn.tasks];
      const destinationTasks = [...destinationColumn.tasks];

      const [movedTask] = sourceTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, movedTask);

      try {
        // await TaskApi.updateTask(movedTask._id, {
        //   status: destinationColumn.id,
        // });
        isBug
          ? await TestApi.bugLogs(movedTask._id, {
            bugStatus: destinationColumn.id,
          })
          : await TestApi.taskLogs(movedTask._id, {
            testStatus: destinationColumn.id,
          });

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === movedTask._id
              ? { ...task, status: destinationColumn.id }
              : task
          )
        );
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
    }

    fetchTasks();
  };

  useEffect(() => {
    if (localStorage.getItem("dontShowInProgressToast") === "true") {
      setDontShowAgain(true);
    }
  }, []);

  const handleYesClick = async () => {
    if (taskToMove && taskInProgress && !isBug) {
      await TestApi.taskLogs(taskInProgress._id, { testStatus: "hold" });
      await TestApi.taskLogs(taskToMove._id, { testStatus: "inprogress" });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskInProgress._id
            ? { ...task, testStatus: "hold" }
            : task._id === taskToMove._id
              ? { ...task, testStatus: "inprogress" }
              : task
        )
      );
    } else {
      await TestApi.bugLogs(taskInProgress._id, { bugStatus: "hold" });
      await TestApi.bugLogs(taskToMove._id, { bugStatus: "inprogress" });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskInProgress._id
            ? { ...task, bugStatus: "hold" }
            : task._id === taskToMove._id
              ? { ...task, bugStatus: "inprogress" }
              : task
        )
      );
    }

    setShowToast(false);
  };

  const handleNoClick = () => {
    setShowToast(false);
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-2 ">
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
                  <Column
                    column={column}
                    handleClick={handleClick}
                    isBug={isBug}
                  />
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
              The existing task in 'In Progress' has been moved to 'Hold'.
            </p>
            <p>You can now move this task to 'In Progress'.</p>
          </div>
          <div className="ml-4 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleYesClick}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Yes
              </button>
              <button
                onClick={handleNoClick}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={() => setDontShowAgain(!dontShowAgain)}
                className="rounded"
              />
              <label className="text-sm">Don't show me again</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
