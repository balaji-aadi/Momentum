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
