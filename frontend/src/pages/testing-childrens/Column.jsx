// TestingColumn.jsx
import React from "react";
import { Droppable } from "react-beautiful-dnd";
import TestingTask from "./TestingTask";
import BugTasks from "./BugTasks";

const TestingColumn = ({ column, handleClick, isBug }) => {
  // Define column header colors based on status
  const getColumnHeaderColor = () => {
    switch (column.name.toLowerCase()) {
      case "not executed":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700";
      case "in progress":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      case "pass":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "fail":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "blocked":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`p-4 rounded-lg shadow-sm ${getColumnHeaderColor()} border-l-4 mb-4 transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider">
              {column.name}
            </h2>
          </div>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm">
            {column.tasks.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 pb-2 pr-2 transition-colors duration-150 ${snapshot.isDraggingOver
              ? "bg-gray-100/50 dark:bg-gray-700/30 rounded-lg"
              : ""
              }`}
          >
            <div className="space-y-3 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
              {column.tasks.map((task, index) =>
                isBug ? (
                  <BugTasks
                    key={task._id}
                    task={task}
                    index={index}
                    handleClick={handleClick}
                  />
                ) : (
                  <TestingTask
                    key={task._id}
                    task={task}
                    index={index}
                    handleClick={handleClick}
                  />
                )
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default TestingColumn;