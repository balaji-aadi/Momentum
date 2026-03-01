import React, { useState, useEffect } from "react";
import { Table } from "../../components/Table/Table";
import { FaRegEdit } from "react-icons/fa";
import { TaskApi } from "../../services/api/Task.api";
import moment from "moment";
import { useLoading } from "../../components/loader/LoaderContext";
import CreateTask from "./CreateTask";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

const UpdateTask = () => {
  const { currentUser } = useSelector((state) => state.store);
  const [id, setId] = useState();
  const { handleLoading } = useLoading();
  const [task, setTask] = useState([]);

  const breadcrumbs = [
    { label: "My Task", path: "/" },
    { label: "List View", path: "/task/update-task" },
  ];

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const getAllTasks = () => {
    return TaskApi.getAllTasks();
  };

  const getAllTasksByType = () => {
    return TaskApi.getAllTasks({ filter: { type } });
  };

  const columns = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    {
      headerName: "Task ID",
      field: "taskId",
      minWidth: 100,
      cellRenderer: (params) => {
        return <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">{params.data.taskId || "N/A"}</span>;
      },
    },
    {
      headerName: "Assignee",
      field: "assignee",
      cellRenderer: (params) => {
        const assignee = params?.data?.assignee;
        const fullName = `${assignee?.firstName || ""} ${assignee?.lastName || ""}`;

        return (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium mt-3">{fullName}</span>
          </div>
        );
      },
    },

    {
      headerName: "Task Name",
      field: "taskName",
    },
    {
      headerName: "Project",
      field: "projectName",
      cellRenderer: (params) => {
        return params?.data?.projectName?.name;
      },
    },
    {
      headerName: "Description",
      field: "taskDescription",
    },
    {
      headerName: "Priority",
      field: "taskPriority",
    },
    {
      headerName: "Time spend",
      field: "estimatedHours",
      cellRenderer: (params) => {
        let totalInProgressTime = 0;
        if (params.data.activityLogs && params.data.activityLogs.length > 0) {
            const sortedLogs = [...params.data.activityLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            let lastTimestamp = null;
            let lastStatus = null;
            
            sortedLogs.forEach((log) => {
                if (lastStatus === "inprogress" && lastTimestamp) {
                    totalInProgressTime += (new Date(log.date) - new Date(lastTimestamp));
                }
                lastTimestamp = log.date;
                lastStatus = log.currentStatus;
            });

            if (params.data.status === "inprogress" && lastTimestamp) {
                totalInProgressTime += (new Date() - new Date(lastTimestamp));
            }
        }
        
        if (totalInProgressTime === 0 && params.data.estimatedHours) {
            return `${params.data.estimatedHours}h 0m`;
        } else if (totalInProgressTime === 0) {
            return "-";
        }

        const totalMinutes = Math.round(totalInProgressTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    },
    {
      headerName: "Start Date",
      field: "taskStartDate",
      cellRenderer: (params) =>
        params?.data?.taskStartDate
          ? moment(params.data.taskStartDate).format("DD-MM-YYYY")
          : "N/A",
    },
    {
      headerName: "Due Date",
      field: "taskDueDate",
      cellRenderer: (params) =>
        params?.data?.taskDueDate
          ? moment(params.data.taskDueDate).format("DD-MM-YYYY")
          : "N/A",
    },
    {
      headerName: "Current Status",
      field: "status",
      cellRenderer: (params) => {
        const status = params?.data?.status;
        let statusColor = "";

        switch (status) {
          case "inprogress":
            statusColor = "bg-red-500";
            break;
          case "done":
            statusColor = "bg-green-500";
            break;
          case "todo":
            statusColor = "bg-yellow-500";
            break;
          case "hold":
            statusColor = "bg-blue-500";
            break;
          default:
            statusColor = "bg-gray-500";
            break;
        }

        return (
          <div
            className={`mt-2 p-2 ${statusColor} capitalize text-white text-xs`}
          >
            {status}
          </div>
        );
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => {
        if (currentUser?.userRole?.name === 'employee') {
            return null;
        }

        return (
          <button
            className="px-4 rounded cursor-pointer"
            onClick={() => handleSingleTask(params?.data)}
          >
            <FaRegEdit />
          </button>
        );
      },
    },
  ];

  const handleSingleTask = async (params) => {
    handleLoading(true);
    setId(params?._id);
    try {
      const res = await TaskApi.task(params?._id);
      setTask(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  // lock body scroll when modal is open and allow ESC to close
  useEffect(() => {
    if (id) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        setId();
        setTask([]);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [id]);

  return (
    <div className="p-6 w-full">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <h3 className="text-gray-700 dark:text-themeText text-2xl font-semibold mb-4">
        Task Logs / Update Tasks
      </h3>

      <div className="mt-4">
        <Table
          column={columns}
          getTableFunction={type ? getAllTasksByType : getAllTasks}
          searchLabel={"Tasks"}
          totalCount={true}
          isExport={true}
          sheetName={"Task"}
        />
      </div>

      {/* Modal for editing task */}
      {id && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setId(); setTask([]); }} />
          <div className="relative w-full max-w-4xl h-[90vh] overflow-auto bg-white dark:bg-themeBG rounded-2xl shadow-2xl z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-bold">Update Task</h4>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => { setId(); setTask([]); }}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <CreateTask modalMode={true} task={task} id={id} setId={setId} setTask={setTask} setProjectTasks={setTask} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTask;

