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
  const getColumnHeaderColor = () => {
    switch (column.name.toLowerCase()) {
      case "todo":
        return "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700";
      case "in progress":
        return "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700";
      case "review":
        return "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700";
      case "done":
        return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
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