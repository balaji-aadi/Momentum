// import React, { useState, useEffect, useRef } from "react";
// import { Draggable } from "react-beautiful-dnd";
// import { IoFlagSharp } from "react-icons/io5";
// import { IoMdTime } from "react-icons/io";
// import { FaCalendar } from "react-icons/fa";
// import { FiActivity } from "react-icons/fi";
// import Activity from "./Activity";
// import { IoFileTrayFull } from "react-icons/io5";
// import { CommonApi } from "../../services/api/Common.api";
// import { server } from "../../services/config";
// import { Link } from "react-router-dom";

// const Task = ({ key, task, index, handleClick }) => {

//   const [, setMenuOpen] = useState(false);
//   const [openActivity, setOpenActivity] = useState(false);
//   const [file, setFile] = useState(null);

//   const menuRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const fetchUploadFile = async (filename) => {
//     try {
//       await CommonApi.getFile(filename);
//       setFile(`${server}file/get-file/${filename}`);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     if (task?.attachments?.length > 0) {
//       task.attachments.map((filename) => fetchUploadFile(filename));
//     }
//   }, []);

//   const renderAssigneeImage = () => {
//     if (task.assignee.profileImage) {
//       return (
//         <img
//           src={task.assignee.profileImage}
//           alt={task.assignee.firstName}
//           className="w-12 h-12 rounded-full object-cover"
//         />
//       );
//     } else {
//       const firstLetter = task.assignee.firstName.charAt(0).toUpperCase();
//       const colors = [
//         "bg-red-500",
//         "bg-blue-500",
//         "bg-green-500",
//         "bg-yellow-500",
//         "bg-purple-500",
//       ];
//       const randomColor = colors[Math.floor(Math.random() * colors.length)];

//       return (
//         <div
//           className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${randomColor}`}
//         >
//           {firstLetter}
//         </div>
//       );
//     }
//   };

//   return (
//     <>
//       <Draggable key={key} draggableId={task._id} index={index}>
//         {(provided) => (
//           <div
//             ref={provided.innerRef}
//             {...provided.draggableProps}
//             {...provided.dragHandleProps}
//             className="dark:bg-[#1E293B] max-h-[15rem] overflow-auto bg-white dark:text-themeText text-black p-5 rounded-lg shadow-lg hover:shadow-2xl transition-all relative w-full"
//           >
//             <main onClick={() => handleClick(task)}>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   {renderAssigneeImage()}
//                   <div>
//                     <h3 className="text-lg font-bold ">
//                       {task.assignee.firstName} {task.assignee.lastName}
//                     </h3>
//                     <p className="text-xs ">{task.projectName.name}</p>
//                     <p
//                       className={`${task.taskPriority === "high"
//                         ? "text-red-500"
//                         : task.taskPriority === "medium"
//                           ? "text-yellow-500"
//                           : task.taskPriority === "low"
//                             ? "text-green-500"
//                             : ""
//                         } font-semibold text-xs mt-1 flex items-center gap-1`}
//                     >
//                       <IoFlagSharp />
//                       {task.taskPriority.charAt(0).toUpperCase() +
//                         task.taskPriority.slice(1)}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <p className="text-md uppercase font-bold text-gray-900 leading-snug dark:text-themeText pb-1">
//                   {task.taskName}
//                 </p>
//                 <p className="text-sm pt-1 ">{task.taskDescription}</p>
//               </div>
//             </main>

//             <div className="mt-4 flex justify-between items-center">
//               <div className="flex flex-col gap-2 text-xs text-gray-500">
//                 <p className="flex items-center font-semibold gap-2">
//                   <IoMdTime /> {task.estimatedHours} hours
//                 </p>
//                 <p className="flex items-center gap-2">
//                   <FaCalendar />
//                   <span className="text-sm">
//                     {new Date(task.taskStartDate).toLocaleDateString()} -
//                     {new Date(task.taskDueDate).toLocaleDateString()}
//                   </span>
//                 </p>
//               </div>

//               <div className="flex flex-col items-center gap-2">
//                 <div
//                   className="border-2 dark:border-white border-gray-600 rounded-full p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
//                   onClick={() => setOpenActivity(true)}
//                 >
//                   <FiActivity title="Activity" />
//                 </div>
//                 {task?.attachments?.length > 0 && (
//                   <Link
//                     to={file}
//                     target="_blank"
//                     className="border-2 dark:border-white border-gray-600 rounded-full p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
//                   >
//                     <IoFileTrayFull title="File" />
//                   </Link>
//                 )}
//               </div>
//             </div>

//             {task?.milestone && (
//               <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
//                 <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">Milestone</h4>
//                 <p className="text-md font-semibold dark:text-themeText">
//                   {task.milestone?.milestoneName}
//                 </p>
//                 <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
//                   {task.milestone?.summary}
//                 </p>
//                 {task.milestone?.deliverables && (
//                   <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
//                     {task.milestone.deliverables.split(',').map((item, index) => (
//                       <li key={index}>{item.trim()}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             )}

//             {task.additionalNotes && (
//               <div className="mt-4 text-xs flex gap-2 border-t-2 py-2 border-gray-500">
//                 <strong>Notes:</strong>
//                 <p>{task.additionalNotes}</p>
//               </div>
//             )}
//           </div>
//         )}
//       </Draggable>

//       {openActivity && (
//         <Activity
//           isOpen={openActivity}
//           onClose={() => setOpenActivity(false)}
//           task={task}
//           type={"Task"}
//         />
//       )}
//     </>
//   );
// };

// export default Task;


import React, { useState, useEffect, useRef } from "react";
import { Draggable } from "react-beautiful-dnd";
import { IoFlagSharp } from "react-icons/io5";
import { IoMdTime } from "react-icons/io";
import { FaCalendar } from "react-icons/fa";
import { FiActivity, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Activity from "./Activity";
import { IoFileTrayFull } from "react-icons/io5";
import { CommonApi } from "../../services/api/Common.api";
import { server } from "../../services/config";
import { Link } from "react-router-dom";
import moment from "moment";
import { FiLink2, FiX } from 'react-icons/fi';
import Modal from 'react-modal';

const Task = ({ key, task, index, handleClick }) => {
  const [, setMenuOpen] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);
  const [file, setFile] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openDependentTasksModal, setOpenDependentTasksModal] = useState(false)

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

  const fetchUploadFile = async (filename) => {
    try {
      await CommonApi.getFile(filename);
      setFile(`${server}file/get-file/${filename}`);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (task?.attachments?.length > 0) {
      task.attachments.map((filename) => fetchUploadFile(filename));
    }
  }, []);

  const renderAssigneeImage = () => {
    if (task.assignee?.profileImage) {
      return (
        <img
          src={task.assignee.profileImage}
          alt={task.assignee.firstName}
          className="w-8 h-8 rounded-full object-cover border border-white ring-1 ring-white shadow-sm"
        />
      );
    } else {
      const name = `${task.assignee?.firstName || ''} ${task.assignee?.lastName || ''}`;
      return (
        <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || 'U')}&background=random`} 
            className="w-8 h-8 rounded-full border border-white ring-1 ring-white shadow-sm" 
            alt="Assignee" 
        />
      );
    }
  };

  const priorityColors = {
    high: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    low: "bg-emerald-50 text-emerald-600 border-emerald-200"
  };

  return (
    <>
      <Draggable key={key} draggableId={task._id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-surface rounded-xl shadow-sm border border-borderLight transition-all relative w-full hover:shadow-md hover:border-primary/30 group`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="p-4">
              <main onClick={() => handleClick(task)} className="cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 w-full">
                    {renderAssigneeImage()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between w-full gap-2">
                         <h4 className="text-sm font-semibold text-textMain capitalize truncate pr-2">
                           {task.taskName}
                         </h4>
                         {/* Priority Pill */}
                         <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${priorityColors[task.taskPriority] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                           {task.taskPriority}
                         </span>
                      </div>
                      
                      <p className="text-xs text-textSub mt-0.5 truncate">{task.projectName?.name || 'No Project'}</p>

                      {task.taskDescription && (
                        <p className="text-xs text-textSub mt-2 line-clamp-2 leading-relaxed">
                          {task.taskDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {task?.dependentTasks?.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDependentTasksModal(true);
                      }}
                      className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <FiLink2 className="mr-1.5" />
                      {task.dependentTasks.length} dependent task{task.dependentTasks.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <IoMdTime className="mr-1" /> {task.estimatedHours}h
                    </span>
                    <span className="flex items-center">
                      <FaCalendar className="mr-1" />
                      {new Date(task.taskStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.taskDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
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
              </main>

              {(task?.milestone || task?.additionalNotes || task?.attachments?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex space-x-2">
                      {task?.attachments?.length > 0 && (
                        <Link
                          to={file}
                          target="_blank"
                          className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="View attachment"
                        >
                          <IoFileTrayFull size={14} />
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => setShowMilestone(!showMilestone)}
                      className="flex items-center w-full text-left"
                    >
                      <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center">

                        Show Milestone
                      </h4>
                      {showMilestone ? <FiChevronUp /> : <FiChevronDown />}
                    </button>

                  </div>
                </div>
              )}
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

            {task.additionalNotes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> {task.additionalNotes}
                </p>
              </div>
            )}

            <Modal
              isOpen={openDependentTasksModal}
              onRequestClose={() => setOpenDependentTasksModal(false)}
              contentLabel="Dependent Tasks"
              className="modal-content"
              overlayClassName="modal-overlay"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dependent Tasks ({task.dependentTasks.length})
                  </h3>
                  <button
                    onClick={() => setOpenDependentTasksModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {task.dependentTasks.map((dependentTask, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start space-x-3">
                        {dependentTask.assignee?.avatar ? (
                          <img
                            src={dependentTask.assignee.avatar}
                            alt={`${dependentTask.assignee.firstName} ${dependentTask.assignee.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                            {dependentTask.assignee?.firstName?.charAt(0)}{dependentTask.assignee?.lastName?.charAt(0)}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {dependentTask.assignee?.firstName} {dependentTask.assignee?.lastName}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[dependentTask.taskPriority] || 'bg-gray-200 dark:bg-gray-600'}`}>
                              {dependentTask.taskPriority?.charAt(0).toUpperCase() + dependentTask.taskPriority?.slice(1)}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                            {dependentTask.taskName}
                          </p>

                          {dependentTask.taskDescription && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {dependentTask.taskDescription}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <IoMdTime className="mr-1" />
                              {dependentTask.estimatedHours}h
                            </span>
                            <span className="flex items-center">
                              <FaCalendar className="mr-1" />
                              {new Date(dependentTask.taskStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(dependentTask.taskDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpenDependentTasksModal(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </Draggable>

      {openActivity && (
        <Activity
          isOpen={openActivity}
          onClose={() => setOpenActivity(false)}
          task={task}
          type={"Task"}
        />
      )}
    </>
  );
};

export default Task;