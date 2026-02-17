import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import {
  FaBug,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaLock,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TestingProgressOverview = ({
  testCaseStats,
  bugStats,
  setIsList,
  setTestCaseData,
  setCardTitle,
  setBugData,
}) => {
  const [selectedTab, setSelectedTab] = useState("testCaseStats");

  const handleCardClick = (cardTitle, testCases) => {
    setTestCaseData(testCases);
    setCardTitle(cardTitle);
    setIsList(true);
  };
  const handleBugCardClick = (cardTitle, bugs) => {
    setBugData(bugs);
    setCardTitle(cardTitle);
    setIsList(true);
  };

  const testCaseStatusData = {
    labels: ["Passed", "Failed", "Not Executed"],
    datasets: [
      {
        label: "Test Case Status",
        data: [
          testCaseStats.completedTests?.count,
          testCaseStats.failedTests?.count,
          testCaseStats.notExecutedTests?.count,
        ],
        backgroundColor: ["#4CAF50", "#F44336", "#FFC107"],
        hoverOffset: 4,
      },
    ],
  };

  const bugStatusData = {
    labels: ["Total Logged", "Resolved", "Open", "In Progress", "Closed"],
    datasets: [
      {
        label: "Bug Status",
        data: [
          bugStats.totalBugs?.count,
          bugStats.resolvedBugs?.count,
          bugStats.openBugs?.count,
          bugStats.inprogressBugs?.count,
          bugStats.closedBugs?.count,
        ],
        backgroundColor: [
          "#FFC107",
          "#4CAF50",
          "#2196F3",
          "#F44336",
          "#FF9800",
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-themeBG min-h-screen">
      <div className="container mx-auto">
        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-6 py-2 text-lg font-semibold ${
              selectedTab === "testCaseStats"
                ? "bg-blue-600 text-white rounded-md"
                : "bg-gray-300 text-gray-800 rounded-md"
            }`}
            onClick={() => setSelectedTab("testCaseStats")}
          >
            Test Case Statistics
          </button>
          <button
            className={`px-6 py-2 text-lg font-semibold ${
              selectedTab === "bugStats"
                ? "bg-blue-600 text-white rounded-md"
                : "bg-gray-300 text-gray-800 rounded-md"
            }`}
            onClick={() => setSelectedTab("bugStats")}
          >
            Bug Statistics
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === "testCaseStats" && (
          <div>
            {/* Test Case Status */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleCardClick(
                    "Total Test Cases",
                    testCaseStats.totalTestCases?.testCases
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Total Test Cases</h2>
                  <p className="text-2xl font-bold">
                    {testCaseStats.totalTestCases?.count}
                  </p>
                </div>
                <FaCheckCircle className="text-green-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleCardClick(
                    "Passed Test Cases",
                    testCaseStats.completedTests?.testCases
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Passed</h2>
                  <p className="text-2xl font-bold">
                    {testCaseStats.completedTests?.count}
                  </p>
                </div>
                <FaCheckCircle className="text-green-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleCardClick(
                    "Failed Test Cases",
                    testCaseStats.failedTests?.testCases
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Failed</h2>
                  <p className="text-2xl font-bold">
                    {testCaseStats.failedTests?.count}
                  </p>
                </div>
                <FaTimesCircle className="text-red-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleCardClick(
                    "Not Executed Test Cases",
                    testCaseStats.notExecutedTests?.testCases
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Not Executed</h2>
                  <p className="text-2xl font-bold">
                    {testCaseStats.notExecutedTests?.count}
                  </p>
                </div>
                <FaExclamationTriangle className="text-yellow-500 text-4xl" />
              </div>
            </div>

            <div className="flex gap-3 items-center justify-center w-full">
              {/* Pie Chart for Test Case Status */}
              <div className="bg-white p-6 rounded-lg shadow-lg mb-8 w-[50%] ">
                <h2 className="text-xl font-semibold mb-4">
                  Test Case Status Distribution
                </h2>
                <Pie data={testCaseStatusData} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        )}

        {selectedTab === "bugStats" && (
          <div>
            {/* Bug Stats with Icons */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleBugCardClick("Total Bugs", bugStats.totalBugs?.bugs)
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Total Logged</h2>
                  <p className="text-2xl font-bold">
                    {bugStats.totalBugs?.count}
                  </p>
                </div>
                <FaBug className="text-blue-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleBugCardClick(
                    "Resolved Bugs ",
                    bugStats.resolvedBugs?.bugs
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Resolved</h2>
                  <p className="text-2xl font-bold">
                    {bugStats.resolvedBugs?.count}
                  </p>
                </div>
                <FaCheck className="text-green-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleBugCardClick("Open Bugs", bugStats.openBugs?.bugs)
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Open</h2>
                  <p className="text-2xl font-bold">
                    {bugStats.openBugs?.count}
                  </p>
                </div>
                <FaTimes className="text-red-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleBugCardClick(
                    "In Progress Bugs",
                    bugStats.inprogressBugs?.bugs
                  )
                }
              >
                <div>
                  <h2 className="text-lg font-medium">In Progress</h2>
                  <p className="text-2xl font-bold">
                    {bugStats.inprogressBugs?.count}
                  </p>
                </div>
                <FaCog className="text-yellow-500 text-4xl" />
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between cursor-pointer"
                onClick={() =>
                  handleBugCardClick("Closed Bugs", bugStats.closedBugs?.bugs)
                }
              >
                <div>
                  <h2 className="text-lg font-medium">Closed</h2>
                  <p className="text-2xl font-bold">
                    {bugStats.closedBugs?.count}
                  </p>
                </div>
                <FaLock className="text-gray-500 text-4xl" />
              </div>
            </div>

            {/* Bug Status Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8 max-w-xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">
                Bug Status Distribution
              </h2>
              <Pie data={bugStatusData} options={{ responsive: true }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestingProgressOverview;
