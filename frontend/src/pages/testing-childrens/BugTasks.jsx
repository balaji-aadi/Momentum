// Bug task page

import { FiActivity } from "react-icons/fi";
import Activity from "../task-childrens/Activity";
import { IoFlagSharp } from "react-icons/io5";
import { Draggable } from "react-beautiful-dnd";
import { useEffect, useRef, useState } from "react";

const BugTasks = ({ key, task, index, handleClick }) => {
  const [, setMenuOpen] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderAssigneeImage = (item) => {
    const firstLetter = item.firstName?.charAt(0).toUpperCase() || '?';
    const severityColors = {
      'Critical': 'bg-red-500',
      'High': 'bg-orange-500',
      'Medium': 'bg-yellow-500',
      'Low': 'bg-blue-500'
    };
    const color = severityColors[task.severity] || 'bg-purple-500';

    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${color} border-2 border-white shadow-sm`}>
        {firstLetter}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const statusColors = {
    'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    'Inprogress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  const severityColors = {
    'Critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    'Low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
  };

  return (
    <>
      <Draggable key={key} draggableId={task._id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="bg-white dark:bg-gray-800 rounded-lg shadow transition-all relative w-full border-l-4 border-gray-300 dark:border-gray-600 hover:shadow-md"
          >
            <div className="p-4">
              <main onClick={() => handleClick(task)} className="cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {renderAssigneeImage(task.createdBy)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-medium text-gray-800 capitalize  dark:text-gray-200">
                          {task.createdBy.firstName} {task.createdBy.lastName}
                        </h3>
                        <div className="flex space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${severityColors[task.severity]}`}>
                            {task.severity}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.bugStatus]}`}>
                            {task.bugStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{task.projectId.name}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    {task.bugTitle}
                  </h3>
                  {task.bugDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {task.bugDescription}
                    </p>
                  )}
                </div>

                {task?.assignee && (
                  <div className="mt-2 flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-1">Assigned to:</span>
                    {task.assignee.firstName} {task.assignee.lastName}
                  </div>
                )}

                <div className="mt-3 flex flex-col items-start justify-between text-xs">
                  <div className="text-gray-500 dark:text-gray-400">
                    Created: {formatDate(task.createdAt)}
                  </div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">
                    Reproducibility: {task.reproducibility}
                  </div>
                </div>

                {task?.stepsToReproduce > 0 && <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Steps to Reproduce
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                    {task.stepsToReproduce ? (
                      <p className="whitespace-pre-line">{task.stepsToReproduce}</p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">No steps provided</p>
                    )}
                  </div>
                </div>}
              </main>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenActivity(true);
                  }}
                  className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="View activity"
                >
                  <FiActivity size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {openActivity && (
        <Activity
          isOpen={openActivity}
          onClose={() => setOpenActivity(false)}
          task={task}
          type={"Bug"}
        />
      )}
    </>
  );
};

export default BugTasks;