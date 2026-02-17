import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useSelector } from "react-redux";
import { DashbordApi } from "../../services/api/Dashboard.api";
import { FiActivity, FiCheckCircle, FiClock, FiList, FiPause } from "react-icons/fi";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DeveloperTaskComponent = () => {
  const user = useSelector((state) => state.store.currentUser);
  const developerName = user && `${user.firstName} ${user.lastName}`;

  const [tasks, setTasks] = useState({
    pending: 0,
    completed: 0,
    todo: 0,
    onHold: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeveloperTask = async () => {
    try {
      setIsLoading(true);
      const res = await DashbordApi.developerTaskDetails();
      const task = res.data?.data;

      setTasks({
        pending: task?.inProgress || 0,
        completed: task?.completedTasks || 0,
        todo: task?.todo || 0,
        onHold: task?.holdTasks || 0,
        total: task?.totalTasks || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeveloperTask();
  }, []);

  const data = {
    labels: ["Total", "Pending", "Completed", "Todo", "On Hold"],
    datasets: [
      {
        label: "Task Count",
        data: [
          tasks.total,
          tasks.pending,
          tasks.completed,
          tasks.todo,
          tasks.onHold,
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: {
          size: 14,
          weight: "bold"
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)"
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const statusCards = [
    {
      title: "Total Tasks",
      value: tasks.total,
      icon: <FiActivity className="text-blue-500" size={24} />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Pending",
      value: tasks.pending,
      icon: <FiClock className="text-yellow-500" size={24} />,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "Completed",
      value: tasks.completed,
      icon: <FiCheckCircle className="text-green-500" size={24} />,
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Todo",
      value: tasks.todo,
      icon: <FiList className="text-purple-500" size={24} />,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "On Hold",
      value: tasks.onHold,
      icon: <FiPause className="text-red-500" size={24} />,
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm w-full max-w-4xl mx-auto dark:bg-gray-800 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 dark:bg-gray-700"></div>
        <div className="h-64 bg-gray-200 rounded mb-6 dark:bg-gray-700"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm w-full max-w-4xl mx-auto dark:bg-gray-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
            Task Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {developerName} • <span className="capitalize">{user?.userRole?.name} Team</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
          <FiActivity className="mr-2" />
          Task Distribution
        </h3>
        <div className="h-72">
          <Bar
            data={data}
            options={options}
          />
        </div>
      </div>

      {/* Task Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Task Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${card.bgColor} dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex flex-col items-center`}
            >
              <div className="mb-2">
                {card.icon}
              </div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                {card.title}
              </h4>
              <p className={`text-2xl font-bold ${card.textColor} dark:text-white`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperTaskComponent;