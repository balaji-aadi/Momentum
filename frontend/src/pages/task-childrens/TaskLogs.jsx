import React from "react";
import { Table } from "../../components/Table/Table";

const TaskLogs = () => {
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
      headerName: "Project",
      field: "project",
    },
    {
      headerName: "Task Id",
      field: "task-id",
    },
    {
      headerName: "Description",
      field: "description",
    },
    {
      headerName: "Assign to",
      field: "assign-to",
    },
    {
      headerName: "Priority",
      field: "priority",
    },
    {
      headerName: "Time spend",
      field: "timeSpent",
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
            // Fallback for older tasks with only estimatedHours
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
      field: "startDate",
    },
    {
      headerName: "Due Date",
      field: "dueDate",
    },
    {
      headerName: "Status",
      field: "status",
    },
    {
      headerName: "Progress",
      field: "progressPercentage",
    },
  ];

  return (
    <div>
      <h3 className="text-gray-700  dark:text-themeText text-2xl font-semibold mx-4 my-4">
        Task Logs
      </h3>
      <Table
        column={columns}
        // internalRowData={tasks}
        getTableFunction={() => {}}
        searchLabel={"Task Logs"}
        totalCount={true}
        isExport={true}
        sheetName={"Task Logs"}
      />
    </div>
  );
};

export default TaskLogs;
