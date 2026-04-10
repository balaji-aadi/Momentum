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
import { Draggable } from "@hello-pangea/dnd";
import { IoFlagSharp } from "react-icons/io5";
import { IoMdTime } from "react-icons/io";
import { FaCalendar } from "react-icons/fa";
import { FiActivity, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Activity from "./Activity";
import { IoFileTrayFull } from "react-icons/io5";
import { CommonApi } from "../../services/api/Common.api";
import { server } from "../../services/config";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
window.moment = moment;
import { FiLink2, FiX, FiEye } from 'react-icons/fi';
import Modal from 'react-modal';
import { IoGitNetworkSharp } from "react-icons/io5";

import { useSelector } from "react-redux";

const Task = ({ key, task, index, handleClick }) => {
  const { currentUser } = useSelector((state) => state.store);
  const canCreateSubtask = currentUser?.userRole?.name === "projectmanager" || currentUser?.userRole?.name === "admin";
  
  const [, setMenuOpen] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);
  const [files, setFiles] = useState([]); // Support multiple files
  const [showMilestone, setShowMilestone] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openDependentTasksModal, setOpenDependentTasksModal] = useState(false);
  const navigate = useNavigate();

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
      // Just construct the URL directly or verify access. 
      // The previous logic used CommonApi.getFile(filename) then set state.
      // If we have multiple, we should append or just use a helper.
      const url = `${server}file/get-file/${filename}`;
      setFiles(prev => [...new Set([...prev, url])]);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (task?.attachments?.length > 0) {
      setFiles([]);
      task.attachments.forEach((filename) => fetchUploadFile(filename));
    }
  }, [task?.attachments]);

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
    low: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/20"
  };

  const stripHtml = (html) => {
    if (!html) return "";
    // Basic HTML stripping
    const tmp = html.replace(/<[^>]*>?/gm, '');
    // Unescape common entities just in case they are already escaped
    return tmp
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
  };

  return (
    <>
      <Draggable key={key} draggableId={task._id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors duration-200 hover:shadow-md hover:border-primary/40 overflow-hidden ${
                task.parentTask 
                ? "ml-4 w-[calc(100%-1rem)]" 
                : "w-full"
            }`}
          >
            {/* Hierarchy Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${task.parentTask ? 'bg-blue-500' : 'bg-indigo-500'}`} />

            <div className="p-3.5 sm:p-4">
              {/* Header / Breadcrumbs */}
              <main onClick={() => handleClick(task)} className="cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600/50">
                        {task.taskId || `#${task._id.slice(-4)}`}
                    </span>
                    {task.parentTask && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-400 dark:text-slate-500 font-bold px-1">/</span>
                            <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 truncate uppercase tracking-tight bg-blue-50/50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">
                                <span className="hidden sm:inline opacity-70">Parent:</span>
                                <span className="truncate max-w-[80px] sm:max-w-[140px] underline decoration-blue-200 decoration-1 underline-offset-2">{task.parentTask.taskName}</span>
                            </div>
                        </div>
                    )}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[task.taskPriority] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    {task.taskPriority}
                    </div>
                </div>

                {/* Task Title & Meta */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="shrink-0 mt-0.5">
                    {renderAssigneeImage()}
                    </div>
                    <div className="min-w-0 flex-1">
                    <h4 className={`text-sm sm:text-[15px] font-bold leading-snug mb-0.5 line-clamp-2 ${task.status === 'done' ? 'text-slate-400 line-through opacity-70' : task.parentTask ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {task.taskName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="truncate">{task.projectName?.name || 'Momentum'}</span>
                        {task.subtaskStats?.total > 0 && (
                            <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                                    <IoGitNetworkSharp size={10} className="transform rotate-90" />
                                    {task.subtaskStats.total}
                                </span>
                            </>
                        )}
                    </div>
                    </div>
                </div>

                {/* Description Snippet */}
                {task.taskDescription && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed break-words overflow-hidden w-full max-w-full">
                        {stripHtml(task.taskDescription)}
                    </p>
                )}

                {/* Progress for Parents & Sub-parents */}
                {task.subtaskStats?.total > 0 && (
                    <div className="mb-4 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 group/progress">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <FiActivity size={10} /> Progress
                        </span>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                        {Math.round((task.subtaskStats.completed / task.subtaskStats.total) * 100)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner flex">
                        <div 
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        style={{ width: `${(task.subtaskStats.completed / task.subtaskStats.total) * 100}%` }}
                        />
                    </div>
                    </div>
                )}
              </main>

              {/* Footnote Metadata */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Estimation">
                        <IoMdTime size={14} className="text-slate-400" />
                        {task.estimatedHours}h
                    </span>
                    <span className="flex items-center gap-1" title="Due Date">
                        <FaCalendar size={12} className="text-slate-400" />
                        {moment(task.taskDueDate).format("MMM DD")}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {canCreateSubtask && (
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/task/create-task', { state: { parentTask: task, project: task.projectName } });
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800/30 shadow-sm"
                            title="Add Subtask"
                        >
                            <IoGitNetworkSharp size={14} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenActivity(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 transition-all border border-slate-200 dark:border-slate-600 shadow-sm"
                        title="View Activity"
                    >
                        <FiActivity size={14} />
                    </button>
                </div>
              </div>

              {/* Expandable Sections */}
              {(task?.milestone || task?.additionalNotes || task?.attachments?.length > 0) && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowMilestone(!showMilestone)}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide hover:underline"
                        >
                            {showMilestone ? <FiChevronUp /> : <FiChevronDown />}
                            {task.milestone ? "Milestone" : "Details"}
                        </button>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {(task.attachments || []).filter(f => f && f.trim() !== "").map((file, i) => {
                                    const fileUrl = file.startsWith('http') ? file : `${server}file/get-file/${file}`;
                                    const filename = file.split('/').pop() || `File ${i + 1}`;
                                    const displayName = filename.includes('-') ? filename.split('-').slice(1).join('-') : filename;
                                    return (
                                        <a key={i} href={fileUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition-all p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg group/attachment" title={`Download ${displayName}`}>
                                            <IoFileTrayFull size={14} className="group-hover/attachment:scale-110 transition-transform" />
                                        </a>
                                    );
                                })}
                            </div>
                    </div>

                    {showMilestone && (task.milestone || task.additionalNotes) && (
                        <div className="mt-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-top-1 duration-200">
                            {task.milestone && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mb-2">
                                    <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">{task.milestone.milestoneName}</h5>
                                    <p className="line-clamp-3">{task.milestone.summary}</p>
                                </div>
                            )}
                            {task.additionalNotes && (
                                <div className="italic bg-amber-50/50 dark:bg-amber-900/10 p-2 rounded-lg border-l-2 border-amber-200 dark:border-amber-800/30">
                                    {task.additionalNotes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
              )}
            </div>
            
            <Modal
              isOpen={openDependentTasksModal}
              onRequestClose={() => setOpenDependentTasksModal(false)}
              contentLabel="Dependent Tasks"
              className="modal-content"
              overlayClassName="modal-overlay"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Dependent Tasks ({task.dependentTasks?.length || 0})
                  </h3>
                  <button
                    onClick={() => setOpenDependentTasksModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {task.dependentTasks?.map((dep, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{dep.taskName}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${priorityColors[dep.taskPriority] || 'bg-slate-100'}`}>
                                {dep.taskPriority}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{dep.taskDescription}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 italic">
                            <span>{dep.assignee?.firstName} {dep.assignee?.lastName}</span>
                            <span>•</span>
                            <span>{moment(dep.taskDueDate).format("MMM DD")}</span>
                        </div>
                    </div>
                  ))}
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