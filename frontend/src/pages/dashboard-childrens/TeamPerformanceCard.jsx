import React from "react";
import { Table } from "../../components/Table/Table";
import rabbit from "../../assets/rabbit.png";
import cow from "../../assets/cow.png";
import turtle from "../../assets/turtle.png";
import { DashbordApi } from "../../services/api/Dashboard.api";

const TeamStatistics = () => {
  const columns = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    { headerName: "Name", field: "name", sortable: true, filter: true },
    { headerName: "Team", field: "role", sortable: true, filter: true },
    {
      headerName: "In Progress Tasks",
      field: "inProgress",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Completed Tasks",
      field: "completedTasks",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Total Tasks",
      field: "totalTasks",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Hold Tasks",
      field: "holdTasks",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Performance",
      field: "performance",
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        if (params.value === "Best")
          return (
            <img
              className="w-8 h-8"
              title="Best"
              alt="performance"
              src={rabbit}
            />
          );
        if (params.value === "Average")
          return (
            <img
              alt="performance"
              title="Average"
              className="w-8 h-8"
              src={cow}
            />
          );
        if (params.value === "Slow")
          return (
            <img
              alt="performance"
              title="Slow"
              className="w-8 h-8"
              src={turtle}
            />
          );
        return params.value;
      },
    },
  ];

  const getTeamPerformance = () => {
    return DashbordApi.teamStats();
  };

  const data = [
    {
      sNo: 1,
      name: "Aadesh",
      team: "Development",
      pendingTasks: 5,
      completedTasks: 15,
      totalTasks: 20,
      holdTasks: 2,
      performance: "best",
    },
    {
      sNo: 2,
      name: "Balaji",
      team: "Marketing",
      pendingTasks: 10,
      completedTasks: 10,
      totalTasks: 20,
      holdTasks: 1,
      performance: "average",
    },
    {
      sNo: 3,
      name: "Balaji aadesh",
      team: "Design",
      pendingTasks: 12,
      completedTasks: 8,
      totalTasks: 20,
      holdTasks: 0,
      performance: "slow",
    },
    {
      sNo: 4,
      name: "John Doe",
      team: "Sales",
      pendingTasks: 7,
      completedTasks: 13,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 5,
      name: "Jane Smith",
      team: "Development",
      pendingTasks: 3,
      completedTasks: 17,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 6,
      name: "Michael Brown",
      team: "Marketing",
      pendingTasks: 8,
      completedTasks: 12,
      totalTasks: 20,
      holdTasks: 1,
      performance: "average",
    },
    {
      sNo: 7,
      name: "Emily Clark",
      team: "Design",
      pendingTasks: 4,
      completedTasks: 16,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 8,
      name: "James Wilson",
      team: "Sales",
      pendingTasks: 6,
      completedTasks: 14,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 9,
      name: "Lily Turner",
      team: "Marketing",
      pendingTasks: 5,
      completedTasks: 15,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 10,
      name: "William Harris",
      team: "Development",
      pendingTasks: 7,
      completedTasks: 13,
      totalTasks: 20,
      holdTasks: 1,
      performance: "average",
    },
    {
      sNo: 11,
      name: "Olivia Lee",
      team: "Design",
      pendingTasks: 8,
      completedTasks: 12,
      totalTasks: 20,
      holdTasks: 0,
      performance: "average",
    },
    {
      sNo: 12,
      name: "David Walker",
      team: "Sales",
      pendingTasks: 6,
      completedTasks: 14,
      totalTasks: 20,
      holdTasks: 1,
      performance: "average",
    },
    {
      sNo: 13,
      name: "Sophia White",
      team: "Marketing",
      pendingTasks: 3,
      completedTasks: 17,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 14,
      name: "Jackson Young",
      team: "Development",
      pendingTasks: 4,
      completedTasks: 16,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 15,
      name: "Mason Scott",
      team: "Design",
      pendingTasks: 2,
      completedTasks: 18,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 16,
      name: "Lucas Adams",
      team: "Sales",
      pendingTasks: 9,
      completedTasks: 11,
      totalTasks: 20,
      holdTasks: 1,
      performance: "average",
    },
    {
      sNo: 17,
      name: "Mia Carter",
      team: "Marketing",
      pendingTasks: 1,
      completedTasks: 19,
      totalTasks: 20,
      holdTasks: 0,
      performance: "best",
    },
    {
      sNo: 18,
      name: "Ethan Mitchell",
      team: "Development",
      pendingTasks: 7,
      completedTasks: 13,
      totalTasks: 20,
      holdTasks: 2,
      performance: "average",
    },
    {
      sNo: 19,
      name: "Amelia Perez",
      team: "Design",
      pendingTasks: 10,
      completedTasks: 10,
      totalTasks: 20,
      holdTasks: 0,
      performance: "average",
    },
  ];

  return (
    <div className="p-6 bg-gray-100 rounded-lg dark:bg-themeBG dark:text-themeText border-white border-2">
      <h1 className="text-2xl font-bold text-gray-700 dark:text-themeText py-6">
        Team Statistics
      </h1>
      <Table
        column={columns}
        getTableFunction={getTeamPerformance}
        searchLabel="Search Members"
        totalCount={data.length}
      />
    </div>
  );
};

export default TeamStatistics;
