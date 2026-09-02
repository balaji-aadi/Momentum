// import React from "react";
// import { Droppable } from "react-beautiful-dnd";
// import Task from "./Task";

// const Column = ({ column, handleClick }) => {
//   return (
//     <div className=" bg-transparent p-3">
//       <h2 className=" bg-white dark:bg-primaryBg p-4 dark:text-themeText text-black mb-4 border-b-2 border-[#7095c2] pb-2 flex items-center justify-between rounded-md">
//         <span className="flex items-center dark:text-themeText ">
//           {column.name}
//         </span>
//         <span className="dark:text-black text-gray-500 text-sm shadow-lg rounded-full bg-gray-200 px-2 py-0">
//           {column.tasks.length}
//         </span>
//       </h2>

//       <Droppable droppableId={column.id}>
//         {(provided) => (
//           <div
//             ref={provided.innerRef}
//             {...provided.droppableProps}
//             className="space-y-4 min-h-[60vh] -mr-4 pr-2 max-h-[100vh] overflow-y-auto overflow-x-hidden"
//           >
//             {column.tasks.map((task, index) => (
//               <Task
//                 key={task._id}
//                 task={task}
//                 index={index}
//                 handleClick={handleClick}
//               />
//             ))}
//             {provided.placeholder}
//           </div>
//         )}
//       </Droppable>
//     </div>
//   );
// };

// export default Column;


import React, { useState, useMemo } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import Task from "./Task";

const Column = ({ column, handleClick, isDoneColumn, expandedParents, setExpandedParents, onReleaseHold }) => {
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'desc', 'asc'

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder('none');
  };

  const sortedTasks = useMemo(() => {
    if (isDoneColumn) return column.tasks; // Reorganized sort is handled in Board.jsx
    if (sortOrder === 'none') return column.tasks;
    return [...column.tasks].sort((a, b) => {
      if (a.taskId && b.taskId) {
        const comp = a.taskId.localeCompare(b.taskId, undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'desc' ? -comp : comp;
      }
      const dateA = new Date(a.createdAt || a.taskDueDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.taskDueDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [column.tasks, sortOrder, isDoneColumn]);
  const getColumnPillColor = () => {
    switch (column.name.toLowerCase()) {
      case "todo": return "bg-slate-500";
      case "in progress": return "bg-amber-500";
      case "hold": return "bg-orange-500";
      case "review": return "bg-purple-500";
      case "done": return "bg-emerald-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-2 md:p-3 shadow-inner border border-slate-200/50 dark:border-slate-800/50 w-full">
      {/* Column Header */}
      <div className="px-3 py-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${getColumnPillColor()}`}></span>
          <h2 className="font-extrabold text-slate-700 dark:text-slate-200 text-xs sm:text-sm uppercase tracking-widest">
            {column.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSort}
            className="text-slate-400 hover:text-primary transition-colors focus:outline-none flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
            title={`Sort: ${sortOrder === 'none' ? 'Default' : sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            {sortOrder === 'none' && <FaSort size={12} />}
            {sortOrder === 'desc' && <FaSortDown size={14} className="text-primary" />}
            {sortOrder === 'asc' && <FaSortUp size={14} className="text-primary mb-1" />}
          </button>
          <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
            {column.tasks.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-0 flex flex-col transition-colors duration-300 rounded-xl ${snapshot.isDraggingOver
              ? "bg-vermilion-50/30 dark:bg-vermilion-950/10 ring-2 ring-primary/20 dark:ring-primary/20"
              : ""
              }`}
          >
            {/* vertical scroll lives in this child so the droppable itself isn’t scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-20 pr-1 lg:pr-2 custom-scrollbar">
              <div className="space-y-4 px-1 py-1">
                {sortedTasks.map((task, index) => {
                  if (task.isDoneGroup) {
                    const isExpanded = expandedParents?.includes(task._id);
                    return (
                      <div key={task._id} className="space-y-1 mb-6">
                        {/* Done Group Header */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setExpandedParents(prev =>
                                  prev.includes(task._id) ? prev.filter(id => id !== task._id) : [...prev, task._id]
                                );
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm hover:scale-110"
                              title={isExpanded ? "Collapse Children" : "Expand Children"}
                            >
                              {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/50 shadow-sm">
                              Finished: {new Date(task.actualFinishDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                          {task.nestedChildren?.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-500/60 italic">
                              {task.nestedChildren.length} subtasks
                            </span>
                          )}
                        </div>

                        {/* Main Parent Card */}
                        <div className="w-full">
                          <Task
                            task={task}
                            index={index}
                            handleClick={handleClick}
                            onReleaseHold={onReleaseHold}
                          />
                        </div>

                        {/* Nested Children */}
                        {isExpanded && task.nestedChildren?.length > 0 && (
                          <div className=" border-l-2 border-emerald-200/30 space-y-4 pt-2">
                            {task.nestedChildren.map((child, cIdx) => (
                              <Task
                                key={child._id}
                                task={child}
                                index={1000 + cIdx} // offset index for nested
                                handleClick={handleClick}
                                isNested={true}
                                onReleaseHold={onReleaseHold}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Task
                      key={task._id}
                      task={task}
                      index={index}
                      handleClick={handleClick}
                      onReleaseHold={onReleaseHold}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;