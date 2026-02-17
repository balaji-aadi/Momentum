import React, { useState } from "react";
import { Table } from "../../components/Table/Table";
import { FaRegEdit } from "react-icons/fa";
import { ProjectApi } from "../../services/api/Project.api";
import moment from "moment/moment";
import CreateProject from "./CreateProject";
import { useLoading } from "../../components/loader/LoaderContext";
import { useNavigate, useSearchParams } from "react-router-dom";

const Status = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [projectData, setProjectData] = useState();
  const [id, setId] = useState();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const [columnDefs] = useState([
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => params.node.rowIndex + 1,
    },
    {
      headerName: "Project",
      field: "name",
      enableValue: true,
    },
    {
      headerName: "Key",
      field: "key",
      enableValue: true,
    },
    {
      headerName: "Priority",
      field: "priority",
      enableValue: true,
    },
    {
      headerName: "Start Date",
      field: "startDate",
      cellRenderer: (params) =>
        params?.data?.startDate
          ? moment(params.data.startDate).format("DD-MM-YYYY")
          : "N/A",
    },
    {
      headerName: "Ending Date",
      field: "endDate",
      cellRenderer: (params) =>
        params?.data?.endDate
          ? moment(params.data.endDate).format("DD-MM-YYYY")
          : "N/A",
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: (params) => {
        const status = params?.data?.status || "";

        const statusStyles = {
          active: { backgroundColor: "#2ecc71", text: "Active" },
          inactive: { backgroundColor: "#d9534f", text: "Inactive" },
          hold: { backgroundColor: "#f39c12", text: "Hold" },
          completed: { backgroundColor: "#00a65a", text: "Completed" },
          closed: { backgroundColor: "#3c8dbc", text: "Closed" },
        };

        const { backgroundColor, text } = statusStyles[status] || {
          backgroundColor: "#777",
          text: status || "Unknown",
        };

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
              height: "100%",
            }}
          >
            <span
              style={{
                backgroundColor,
                padding: ".2em .6em .3em",
                fontSize: "12px",
                color: "white",
                fontWeight: "500",
                borderRadius: ".25em",
              }}
            >
              {text}
            </span>
          </div>
        );
      },
    },

    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => {
        return (
          <button
            className="px-4 rounded cursor-pointer"
            onClick={() => handleSingleProject(params)}
          >
            <FaRegEdit />
          </button>
        );
      },
    },
  ]);

  const getAllProjects = () => {
    return ProjectApi.getAllProjects();
  };

  const getAllProjectByType = () => {
    return ProjectApi.getAllProjects({ filter: { type } });
  };

  const { handleLoading } = useLoading();
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate("/project/create-project");
  };

  const handleShowMilestones = () => {
    navigate("/project/milestones")
  }

  const handleSingleProject = async (params) => {
    handleLoading(true);

    try {
      const res = await ProjectApi.project(params?.data?._id);
      setIsUpdating(true);
      setProjectData(res.data?.data);
      setId(params?.data?._id);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  return (
    <>
      {!isUpdating ? (
        <div className="p-10 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 dark:text-themeText text-2xl font-semibold">
              Project Status
            </h3>
            <div className="flex justify-end gap-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold "
                onClick={handleShowMilestones}
              >
                Show Milestones
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold "
                onClick={handleCreateProject}
              >
                Create Project
              </button>
            </div>
          </div>
          <Table
            column={columnDefs}
            getTableFunction={type ? getAllProjectByType : getAllProjects}
            searchLabel={"Status"}
            totalCount={true}
          />
        </div>
      ) : (
        <CreateProject
          data={projectData}
          isUpdating={isUpdating}
          id={id}
          setIsUpdating={setIsUpdating}
          setProjectData={setProjectData}
        />
      )}
    </>
  );
};

export default Status;
