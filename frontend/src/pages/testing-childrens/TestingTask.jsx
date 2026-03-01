// TestingTask.jsx
import { FiActivity, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Activity from "../task-childrens/Activity";
import { IoFlagSharp } from "react-icons/io5";
import { Draggable } from "@hello-pangea/dnd";
import { useEffect, useRef, useState } from "react";
import { CiCircleMore } from "react-icons/ci";
import AssigneModal from "./AssigneModal";

import moment from "moment";

const TestingTask = ({ key, task, index, handleClick }) => {
  const [, setMenuOpen] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);
  const menuRef = useRef(null);
  const [openAssigne, setOpenAssigne] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  console.log("task>>", task)

  const closeModal = () => {
    setOpenAssigne(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderAssigneeImage = () => {
    if (task.createdBy.profileImage) {
      return (
        <img
          src={task.createdBy.profileImage}
          alt={task.createdBy.firstName}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
      );
    } else {
      const firstLetter = task.createdBy.firstName.charAt(0).toUpperCase();
      const colors = {
        "Not Executed": "bg-yellow-500",
        "Pass": "bg-green-500",
        "Fail": "bg-red-500",
      };
      const color = colors[task.testStatus] || "bg-blue-500";

      return (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${color} border-2 border-white shadow-sm`}
        >
          {firstLetter}
        </div>
      );
    }
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const statusColors = {
    "Not Executed": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    "Pass": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    "Fail": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
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
                    {renderAssigneeImage()}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {task.createdBy.firstName} {task.createdBy.lastName}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.testStatus]}`}>
                          {task.testStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{task.projectId.name}</p>

                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mt-2">
                        {task.testCaseName}
                      </h4>
                      {task.testScenarioDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {task.testScenarioDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {task?.assignee && (
                  <div className="mt-2 flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-1">Assigned to:</span>
                    {task.assignee.firstName} {task.assignee.lastName}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Created: {formatDate(task?.createdAt)}
                </div>



                {task?.milestone && (
                  <div className={`border-t border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ${showMilestone ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 ">

                      {showMilestone && (
                        <div className="mt-4 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm overflow-auto max-h-[20vh]">
                          <div>
                            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center mb-1">
                              Milestone: {task.milestone?.milestoneName || "N/A"}
                            </h4>

                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                              <span className="mr-4">
                                <strong className="font-medium text-gray-800 dark:text-gray-200">Start:</strong> {moment(task.milestone?.commenceDate).format("YY-MM-DD")}
                              </span>
                              <span>
                                <strong className="font-medium text-gray-800 dark:text-gray-200">End:</strong> {moment(task.milestone?.expectedDate).format("YY-MM-DD")}
                              </span>
                            </div>

                            {task.milestone?.summary && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 leading-snug">
                                {task.milestone.summary}
                              </p>
                            )}

                            {task.milestone?.deliverables && (
                              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-none pl-0">
                                {task.milestone.deliverables.split(',').map((item, index) => (
                                  <li key={index} className="flex items-start ">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
                                    <span>{item.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                      )}
                    </div>
                  </div>
                )}

                {/* Test Steps */}
                {task?.testSteps.length > 0 && <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Test Steps
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {task.testSteps.map((step, index) => (
                      <div key={step._id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          <span className="text-gray-500 dark:text-gray-400">Step {index + 1}:</span> {step.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">Expected:</span> {step.expectedOutcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>}
              </main>

              <div className="mt-4 flex justify-between">
                {task?.milestone && <button
                  onClick={() => setShowMilestone(!showMilestone)}
                  className="flex items-center w-full text-left"
                >
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                    Show Milestone
                  </h4>
                  {showMilestone ? <FiChevronUp /> : <FiChevronDown />}
                </button>}
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
          type={"Testcase"}
        />
      )}
      {openAssigne && (
        <AssigneModal
          isOpen={openAssigne}
          onClose={closeModal}
          taskDetails={task}
        />
      )}
    </>
  );
};

export default TestingTask;