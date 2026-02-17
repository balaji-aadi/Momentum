// import React, { useEffect, useState } from "react";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import { useParams } from "react-router-dom";
// import { dummyTasks } from "./MyTasks";

// const TestLogUpdates = () => {
//   const [progress, setProgress] = useState("");
//   const [testStatus, setTestStatus] = useState("Not Executed");
//   const [timeSpent, setTimeSpent] = useState("");
//   const [attachments, setAttachments] = useState([]);
//   const { taskId } = useParams();
//   const [task, setTask] = useState(null);

//   const handleFileChange = (event) => {
//     setAttachments([...attachments, ...event.target.files]);
//   };

//   useEffect(() => {
//     const taskData = dummyTasks.find((task) => task.id === parseInt(taskId));
//     setTask(taskData);
//   }, [taskId]);

//   if (!task) return <div>Loading...</div>;

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log({
//       testStatus,
//       progress,
//       timeSpent,
//       attachments,
//     });
//   };

//   return (
//     <div className="p-8 mt-6 bg-gray-100">
//       <h1 className="text-3xl font-bold mb-6">Task Details - {task.title}</h1>
//       <p>{task.description}</p>
//       <p>Status: {task.status}</p>

//       <form onSubmit={handleSubmit} className="space-y-6 mt-6">
//         <div className="mb-4">
//           <label className="block text-lg font-semibold">Test Status</label>
//           <select
//             value={testStatus}
//             onChange={(e) => setTestStatus(e.target.value)}
//             className="w-full p-2 border rounded-lg"
//           >
//             <option value="Not Executed">Not Executed</option>
//             <option value="Pass">Pass</option>
//             <option value="Fail">Fail</option>
//           </select>
//         </div>

//         <div className="mb-4">
//           <label className="block text-lg font-semibold">Progress Update</label>
//           <ReactQuill
//             value={progress}
//             onChange={setProgress}
//             placeholder="Enter the progress or observations..."
//             className="border p-2 rounded-lg"
//           />
//         </div>

//         <div className="mb-4">
//           <label className="block text-lg font-semibold">Attachments</label>
//           <input
//             type="file"
//             onChange={handleFileChange}
//             multiple
//             className="border p-2 rounded-lg"
//           />
//         </div>

//         <div className="mb-4">
//           <label className="block text-lg font-semibold">
//             Time Spent (hours)
//           </label>
//           <input
//             type="number"
//             value={timeSpent}
//             onChange={(e) => setTimeSpent(e.target.value)}
//             className="w-full p-2 border rounded-lg"
//           />
//         </div>

//         <div className="flex justify-end space-x-4">
//           <button
//             type="submit"
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg"
//           >
//             Save Update
//           </button>
//           <button
//             type="button"
//             className="px-6 py-2 bg-red-600 text-white rounded-lg"
//           >
//             Notify Developer
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default TestLogUpdates;
