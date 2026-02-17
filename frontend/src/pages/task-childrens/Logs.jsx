import React, { useEffect, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BiSolidCheckCircle } from "react-icons/bi";
import { ActivityApi } from "../../services/api/Activity.api";
import moment from "moment/moment";
import { useLoading } from "../../components/loader/LoaderContext";
import Activity from "./Activity";
import toast from "react-hot-toast";

const statusMapping = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
  hold: "Hold",
};

const backgroundColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

const Logs = ({ task, type }) => {
  const currentDate = new Date();
  const [openActivity, setOpenActivity] = useState(false);
  const { handleLoading } = useLoading();
  const [logData, setLogData] = useState([]);

  const [logs, setLogs] = useState([]);

  const getAllActivities = async () => {
    const payload = {
      referenceId: task._id,
      type,
    };

    try {
      const res = await ActivityApi.getAllActivity(payload);
      console.log(res.data);
      setLogs(res.data?.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = async (id) => {
    setOpenActivity(true);
    handleLoading(true);
    try {
      const res = await ActivityApi.getSingleActivity(id);
      setLogData(res.data?.data);
    } catch (err) {
      console.log(err);
    }

    handleLoading(false);
  };

  const formatDuration = (minutes) => {
    const min = parseInt(minutes, 10) || 0;

    if (min < 60) {
      return `${min} min`;
    }

    const hrs = Math.floor(min / 60);
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  };



  const handleDelete = async (id) => {
    handleLoading(true);
    try {
      const res = await ActivityApi.deleteActivity(id);
      setLogData(res.data?.data);
      toast.success("Activity deleted successfully");
    } catch (err) {
      console.log(err);
    }

    getAllActivities();
    handleLoading(false);
  };

  const handleDone = async (id) => {
    handleLoading(true);
    try {
      const res = await ActivityApi.activityDone(id);
      toast.success("Activity done successfully");
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }

    getAllActivities();

    handleLoading(false);
  };

  useEffect(() => {
    if (task?._id) {
      getAllActivities();
    }
  }, [task]);

  return (
    <>
      <div className="w-full md:w-[40%] my-10 mr-3 bg-white shadow-lg rounded-xl h-full pb-10 p-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <h2 className="text-lg font-semibold">Recent Logs</h2>
          <span className="text-gray-500 text-xl">⏳</span>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className={`flex flex-col items-start gap-4 p-4  border-b-2  overflow-auto h-[50%] ${log.status === "Completed" ? "bg-green-200" : "bg-white"
                } `}
            >
              <div className="flex gap-2">
                {/* Profile Image or Placeholder */}
                {log.profileImage ? (
                  <img
                    src={log?.assignee?.profileImage}
                    alt="User"
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-full capitalize ${backgroundColors[index % backgroundColors.length]
                      } text-white font-bold`}
                  >
                    {log?.assignee?.firstName?.charAt(0)}
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 w-full">
                  <p className="text-gray-600 capitalize">
                    {log.assignee?.firstName} {log.assignee?.lastName}{" "}
                    {log.end_date ? (
                      <span>
                        {moment
                          .utc(log.end_date)
                          .diff(moment.utc(currentDate), "days") >= 0 ? (
                          <>
                            <span className="text-blue-500 font-semibold">
                              Due in{" "}
                              {moment
                                .utc(log?.end_date)
                                .diff(moment.utc(currentDate), "days")}{" "}
                              Days
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-500 font-bold">
                              OverDue :{" "}
                              {moment
                                .utc(currentDate)
                                .diff(moment.utc(log?.end_date), "days")}{" "}
                              days
                            </span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span>
                        {moment
                          .utc(log.dueDate)
                          .diff(moment.utc(log.createdAt), "days") >= 0 ? (
                          <>
                            <span className="text-blue-500 font-semibold">
                              Due in{" "}
                              {moment
                                .utc(log.dueDate)
                                .diff(moment.utc(log.createdAt), "days")}{" "}
                              Days
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-500 font-bold">
                              OverDue :{" "}
                              {moment
                                .utc(currentDate)
                                .diff(moment.utc(log.dueDate), "days")}{" "}
                              days
                            </span>
                          </>
                        )}
                      </span>
                    )}
                    <p>
                      {" "}
                      <span className="text-sm">Created By : </span>{" "}
                      {moment(log?.createdAt).format("YYYY/MM/DD")}{" "}
                    </p>
                  </p>

                  <div className="flex flex-col mt-1">
                    <span className="font-bold text-gray-800">
                      {log?.activityType} Activity
                    </span>
                    <span className="text-gray-600">
                      {log?.summary} for{" "}
                      <span className="text-sm">
                        {log.assignee?.firstName} {log?.assignee?.lastName}
                      </span>
                    </span>
                    <span className="text-gray-500 max-h-[5rem] overflow-auto block">
                      <span className="text-sm font-bold text-black">
                        Description :
                      </span>{" "}
                      {log.description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {log.status === "Completed" ? null : (
                <div className="flex items-center gap-2">
                  <button
                    className="text-green-600 hover:text-green-700"
                    title="Done"
                    onClick={() => handleDone(log?._id)}
                  >
                    <BiSolidCheckCircle className="text-3xl" />
                  </button>
                  <button
                    className="text-blue-500 hover:text-blue-600"
                    onClick={() => handleEdit(log?._id)}
                    title="Edit"
                  >
                    <FaRegEdit className="text-2xl" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-600"
                    title="Delete"
                    onClick={() => handleDelete(log?._id)}
                  >
                    <MdDelete className="text-2xl" />
                  </button>
                </div>
              )}
            </div>
          ))}

        </div>
        <div className="mt-4  h-[50vh] overflow-auto relative">
          {type === "Testcase" ? null : (
            <div className="sticky top-0 bg-white shadow-md p-3 z-10 flex flex-col gap-2 border-b">
              <h3 className="text-gray-700 font-bold text-lg">📌 Task Duration</h3>

              <div className="flex justify-between">
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md shadow-sm">
                  <i className="fas fa-clock text-yellow-600"></i>
                  <span className="font-medium text-md">
                    Hold: {formatDuration(task.duration?.hold)}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-md shadow-sm">
                  <i className="fas fa-spinner text-blue-600 animate-spin"></i>
                  <span className="font-medium text-md">
                    In Progress: {formatDuration(task.duration?.inprogress)}
                  </span>
                </div>
              </div>
            </div>
          )}


          {task.activityLogs &&
            task.activityLogs.length > 0 &&
            task.activityLogs.map((log, index) => {
              const statusChange = log.message
                .replace("Status had been changed from", "Status changed from")
                .replace("Status changed from", "")
                .replace(">>>", "➝")
                .trim();

              const statuses = statusChange
                .split("➝")
                .map((status) => statusMapping[status.trim()] || status.trim());

              return (
                <div
                  key={log._id}
                  className="flex items-start gap-4 py-2 border-b pr-3"
                >
                  {log.user?.profileImage ? (
                    <img
                      src={log.user?.profileImage}
                      alt="User"
                      className="w-10 h-10 rounded-full border"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full ${backgroundColors[index % backgroundColors.length]
                        } text-white font-bold`}
                    >
                      {log?.user?.firstName?.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-medium">
                      {log.user?.firstName} {log.user?.lastName}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(log.date).toLocaleString()}
                    </p>
                    {log.message !== "Task created with status Todo" ? (
                      <p className="text-sm font-semibold">{`${statuses[0]} ➝ ${statuses[1]}`}</p>
                    ) : (
                      <p className="text-sm font-semibold">Task Created</p>
                    )}
                  </div>

                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                </div>
              );
            })}
        </div>
      </div>
      {openActivity && (
        <Activity
          isOpen={openActivity}
          onClose={() => setOpenActivity(false)}
          task={logData}
          type={"Testcase"}
          isUpdate={true}
          getAllActivities={getAllActivities}
        />
      )}
    </>
  );
};

export default Logs;
