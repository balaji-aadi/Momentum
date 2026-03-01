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


import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import Task from "./Task";

const Column = ({ column, handleClick }) => {
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
          <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
            {column.tasks.length}
          </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-0 transition-colors duration-300 rounded-xl ${snapshot.isDraggingOver
              ? "bg-indigo-50/50 dark:bg-indigo-900/10 ring-2 ring-indigo-200/50 dark:ring-indigo-800/20"
              : ""
              }`}
          >
            {/* vertical scroll lives in this child so the droppable itself isn’t scrollable */}
            <div className="flex-1 min-h-0 max-h-[70vh] overflow-auto pb-4 pr-2">
              <div className="space-y-4 overflow-x-hidden custom-scrollbar px-1 py-1 pb-10">
                {column.tasks.map((task, index) => (
                  <Task
                    key={task._id}
                    task={task}
                    index={index}
                    handleClick={handleClick}
                  />
                ))}
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