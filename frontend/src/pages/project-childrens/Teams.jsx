import React, { useState } from "react";
import { Table } from "../../components/Table/Table";
import { ProjectApi } from "../../services/api/Project.api";
import { RxCross2 } from "react-icons/rx";

const generateRandomColor = () => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const TeamMembersModal = ({ teamMembers, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-100 p-4">
          <h4 className="text-lg font-semibold text-gray-700">Team Members</h4>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition duration-200"
          >
            <RxCross2 className="text-2xl" />
          </button>
        </div>
        <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-50 p-3 rounded-lg shadow-md hover:bg-gray-200 transition duration-200"
            >
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={member.firstName}
                  className="w-12 h-12 rounded-full border-2 border-white mr-4"
                />
              ) : (
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full border-2 border-white mr-4 ${generateRandomColor()}`}
                >
                  <span className="text-white font-semibold">
                    {member.firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-grow">
                <div className="font-semibold text-gray-800">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {member?.rolesAndResponsibilities &&
                    member.rolesAndResponsibilities.map((roleItem, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        <p className="font-medium">
                          <span className="font-bold">Role :</span>{" "}
                          {roleItem.role}
                        </p>

                        <p className="font-medium">
                          <span className="font-bold">Responsibility :</span>{" "}
                          {roleItem.responsibility || "N/A"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Teams = () => {
  const [modalData, setModalData] = useState({
    isOpen: false,
    teamMembers: [],
  });

  const openModal = (teamMembers) => {
    setModalData({
      isOpen: true,
      teamMembers,
    });
  };

  const closeModal = () => setModalData({ isOpen: false, teamMembers: [] });

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
      minWidth: 300,
    },
    {
      headerName: "Project Manager",
      field: "project-manager",
      cellRenderer: (params) => {
        const manager = params.data.projectManager;
        return manager ? (
          <div className="text-sm pt-2">
            {manager.firstName} {manager.lastName}
          </div>
        ) : (
          <div className="text-sm pt-2">No Manager Assigned</div>
        );
      },
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: (params) => {
        const statusColors = {
          Done: "bg-green-500",
          "In Progress": "bg-blue-500",
          Paused: "bg-yellow-500",
          Backlog: "bg-red-500",
        };
        return (
          <span
            className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${
              statusColors[params.data.status]
            }`}
          >
            {params.data.status}
          </span>
        );
      },
    },
    {
      headerName: "Members",
      field: "team-members",
      cellRenderer: (params) => {
        return (
          <div className="flex items-center relative">
            {params.data.teamMembers.slice(0, 3).map((member, index) => (
              <div
                key={index}
                className="relative group"
                onClick={() => openModal(params.data.teamMembers)}
              >
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.firstName}
                    className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 cursor-pointer"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 border-white -ml-2 first:ml-0 cursor-pointer ${generateRandomColor()}`}
                  >
                    <span className="text-white text-xs font-semibold">
                      {member.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {params.data.teamMembers.length > 3 && (
              <span
                className="ml-2 relative text-gray-600 text-sm cursor-pointer"
                onClick={() => openModal(params.data.teamMembers)}
              >
                +{params.data.teamMembers.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
  ]);

  return (
    <div className="p-10 w-full relative">
      <h3 className="text-gray-700 dark:text-themeText text-2xl font-semibold mb-4">
        Team Projects
      </h3>
      <Table
        column={columnDefs}
        getTableFunction={ProjectApi.getAllProjects}
        searchLabel="Project"
        totalCount={true}
      />
      {modalData.isOpen && (
        <TeamMembersModal
          teamMembers={modalData.teamMembers}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Teams;
