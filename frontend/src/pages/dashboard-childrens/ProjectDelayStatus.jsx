import React, { useMemo, useState } from "react";
import { Table } from "../../components/Table/Table";

const ProjectDelayStatus = ({ projects }) => {
  const [expandedProject, setExpandedProject] = useState(null);

  const delayedColumnDefs = useMemo(
    () => [
      { field: "name", headerName: "Team Member" },
      { field: "task", headerName: "Task" },
      { field: "reason", headerName: "Reason for Delay" },
    ],
    []
  );

  const nonDelayedColumnDefs = useMemo(
    () => [
      { field: "name", headerName: "Team Member" },
      { field: "task", headerName: "Task" },
    ],
    []
  );

  const toggleProject = (projectIndex) => {
    setExpandedProject((prevIndex) =>
      prevIndex === projectIndex ? null : projectIndex
    );
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-themeBG dark:text-themeText border-2 border-white rounded-lg">
      {projects.map((project, index) => {
        const delayedMembers = project.teamMembers.filter((m) => m.isDelayed);
        const nonDelayedMembers = project.teamMembers.filter(
          (m) => !m.isDelayed
        );

        return (
          <div key={index} className="mb-8">
            <div
              className="cursor-pointer mb-2 flex items-center justify-between"
              onClick={() => toggleProject(index)}
            >
              <h2 className="text-2xl font-bold text-blue-600">
                {project.projectName}
              </h2>
              <span className="text-sm text-gray-600">
                {expandedProject === index ? "Collapse" : "Expand"}
              </span>
            </div>

            {expandedProject === index && (
              <div className="p-4 bg-white rounded-lg shadow-md dark:bg-themeBG dark:text-themeText border-2 border-white">
                {delayedMembers.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-yellow-600 mb-2">
                      Delayed Members
                    </h3>
                    <Table
                      column={delayedColumnDefs}
                      internalRowData={delayedMembers}
                      searchLabel="Delayed Members"
                      totalCount={true}
                    />
                  </>
                )}

                {nonDelayedMembers.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-green-600 mb-2 mt-6">
                      Non-Delayed Members
                    </h3>
                    <Table
                      column={nonDelayedColumnDefs}
                      internalRowData={nonDelayedMembers}
                      searchLabel="Non-Delayed Members"
                      totalCount={true}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectDelayStatus;
