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
import { Droppable } from "react-beautiful-dnd";
import Task from "./Task";

const Column = ({ column, handleClick }) => {
  const getColumnPillColor = () => {
    switch (column.name.toLowerCase()) {
      case "todo": return "bg-slate-500";
      case "in progress": return "bg-amber-500";
      case "review": return "bg-purple-500";
      case "done": return "bg-emerald-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl p-2 md:p-3 shadow-sm border border-transparent min-w-[300px]">
        {/* Column Header */}
      <div className="px-2 py-3 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${getColumnPillColor()}`}></span>
             <h2 className="font-bold text-textMain text-sm uppercase tracking-wide">
              {column.name}
            </h2>
          </div>
          <span className="bg-white border border-borderLight text-textSub px-2 py-0.5 rounded text-xs font-bold shadow-sm">
            {column.tasks.length}
          </span>
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
            <div className="space-y-3 max-h-[100vh] -mr-2 pr-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
        )}
      </Droppable>
    </div>
  );
};

export default Column;