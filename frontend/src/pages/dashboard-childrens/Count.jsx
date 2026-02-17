import React, { useEffect, useState } from "react";
import { FaUsers, FaTasks, FaProjectDiagram } from "react-icons/fa";
import { MdOutlineTaskAlt, MdOutlinePauseCircle } from "react-icons/md";
import { DashbordApi } from "../../services/api/Dashboard.api";
import { useNavigate } from "react-router-dom";

const Count = () => {
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();

  const getAllData = async () => {
    try {
      const res = await DashbordApi.getAllData();
      console.log(res.data?.data);
      setStats(res.data?.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getIcon = (i) => {
    switch (i) {
      case "M":
        return <FaUsers className="text-blue-500 text-4xl" />;
      case "T":
        return <FaProjectDiagram className="text-green-500 text-4xl" />;
      case "A":
        return <FaTasks className="text-yellow-500 text-4xl" />;
      case "O":
        return <MdOutlineTaskAlt className="text-orange-500 text-4xl" />;
      case "H":
        return <MdOutlinePauseCircle className="text-red-500 text-4xl" />;
      default:
        return null;
    }
  };

  const handleClick = (i) => {
    switch (i) {
      case "M":
        return navigate(`/user/create?type=member`);
      case "T":
        return navigate("/project/team?type=all-team");
      case "A":
        return navigate("/project/status?type=active");
      case "O":
        return navigate("/task/update-task?type=open");
      case "H":
        return navigate("/task/update-task?type=hold");
      default:
        return null;
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 ">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white dark:bg-themeBG border-white border-2 cursor-pointer dark:text-themeText shadow-lg rounded-lg flex items-center p-4 hover:shadow-xl transition-shadow duration-300"
          onClick={() => handleClick(stat?.icon)}
        >
          <div className="mr-4">{getIcon(stat.icon)}</div>
          <div>
            <h4 className="text-lg font-semibold dark:text-themeText  text-gray-600">
              {stat.title}
            </h4>
            <p className="text-2xl font-bold dark:text-themeText text-gray-800">
              {stat.count}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Count;
