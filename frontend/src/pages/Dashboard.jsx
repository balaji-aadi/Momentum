import React, { useState } from "react";
import Count from "./dashboard-childrens/Count";
import TeamPerformanceCard from "./dashboard-childrens/TeamPerformanceCard";
import ProjectStatistics from "./dashboard-childrens/ProjectStatistics";
import ProjectDelayStatus from "./dashboard-childrens/ProjectDelayStatus";
import TaskDeliverables from "./dashboard-childrens/TaskDeliverables";
import DeveloperTaskComponent from "./dashboard-childrens/DeveloperTaskComponent";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("project");
  const { currentUser } = useSelector((state) => state.store);
  const [manager, setManager] = useState(
    currentUser?.userRole?.name === "projectmanager" ? true : false
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "project":
        return <ProjectStatistics />;
      case "team":
        return <TeamPerformanceCard />;
      // case "delay":
      //   return <ProjectDelayStatus projects={dummyProjects} />;
      case "deliverables":
        return <TaskDeliverables />;
      default:
        return null;
    }
  };

  return (
    <div className="container w-full p-6 dark:bg-themeBG dark:text-themeText ">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {manager && <Count />}

      {manager ? (
        <div className="">
          <div className="tabs flex flex-wrap mb-6 space-x-2 items-center justify-center w-full mt-4">
            <button
              className={`tab-btn py-2 px-4 rounded-md text-lg font-semibold transition-colors ${activeTab === "project"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              onClick={() => setActiveTab("project")}
            >
              Project Stats
            </button>
            <button
              className={`tab-btn py-2 px-4 rounded-md text-lg font-semibold transition-colors ${activeTab === "team"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              onClick={() => setActiveTab("team")}
            >
              Team Stats
            </button>
            {/* <button
              className={`tab-btn py-2 px-4 rounded-md text-lg font-semibold transition-colors ${
                activeTab === "delay"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-blue-100"
              }`}
              onClick={() => setActiveTab("delay")}
            >
              Delay Stats
            </button> */}
            <button
              className={`tab-btn py-2 px-4 rounded-md text-lg font-semibold transition-colors ${activeTab === "deliverables"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              onClick={() => setActiveTab("deliverables")}
            >
              Task Deliverables
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">{renderTabContent()}</div>
        </div>
      ) : (
        <div className="m-10">
          <DeveloperTaskComponent />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
