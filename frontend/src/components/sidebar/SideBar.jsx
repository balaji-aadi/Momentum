import { Link, NavLink } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { BiCog } from "react-icons/bi";
import { useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarMenu from "./SideBarMenu";
import { ToggleContext } from "../store/LayoutHook";
import { BiSolidOffer } from "react-icons/bi";
import "./sidebar.style.css";
import logo from "../../assets/main_logo.png";
import { GoDot } from "react-icons/go";
import { RiMastercardLine } from "react-icons/ri";
import { TbRulerMeasure } from "react-icons/tb";
import { data } from "../../Template/demo";
import { BiSolidDollarCircle } from "react-icons/bi";
import { AiOutlineProduct } from "react-icons/ai";
import { FaTasks } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import { SiTestin } from "react-icons/si";
import { FaUsers } from "react-icons/fa";
import { useSelector } from "react-redux";

const routes = [
  {
    path: "/",
    name: "Home",
    icon: <FaHome />,
  },

  {
    name: "Project Management",
    icon: <GrProjects />,
    subRoutes: [
      // {
      //   name: "Project",
      //   icon: <GoDot />,
      //   path: "project/create-project",
      // },
      {
        name: "My Project",
        icon: <GoDot />,
        path: "project/status",
      },
      {
        name: "Team",
        icon: <GoDot />,
        path: "project/team",
      },
    ],
  },
  {
    name: "Tasks",
    icon: <FaTasks />,
    subRoutes: [
      {
        name: "My Task",
        icon: <GoDot />,
        path: "task/dashboard",
      },
      // {
      //   name: "My Bugs",
      //   icon: <GoDot />,
      //   path: "task/bug-dashboard",
      // },
      // {
      //   name: "Reports",
      //   icon: <GoDot />,
      //   path: "task-report",
      // },
    ],
  },
  // {
  //   name: "Testing",
  //   icon: <SiTestin />,
  //   subRoutes: [
  //     {
  //       name: "Dashboard",
  //       icon: <GoDot />,
  //       path: "testing/dashboard",
  //     },
  //     {
  //       name: "My Tasks",
  //       icon: <GoDot />,
  //       path: "testing/my-task",
  //     },
  //     {
  //       name: "Test Case Management",
  //       icon: <GoDot />,
  //       path: "testing/test-case-management",
  //     },
  //     {
  //       name: "Bug Reporting",
  //       icon: <GoDot />,
  //       path: "testing/bug-reporting",
  //     },
  //     // {
  //     //   name: "Reports",
  //     //   icon: <GoDot />,
  //     //   path: "test-report",
  //     // },
  //   ],
  // },
  {
    name: "User",
    icon: <FaUsers />,
    subRoutes: [
      {
        name: "Create/Update",
        icon: <GoDot />,
        path: "user/create",
      },
    ],
  },
];

const SideBar = ({ children }) => {
  const { isOpen, setIsOpen, isToggle } = useContext(ToggleContext);
  const [openMenu, setOpenMenu] = useState(null);

  const { currentUser } = useSelector((state) => state.store);

  const showAnimation = {
    hidden: {
      width: 0,
      opacity: 0,
      transition: {
        duration: 0.5,
      },
    },
    show: {
      opacity: 1,
      width: "auto",
      transition: {
        duration: 0.5,
      },
    },
  };

  const handleEnter = () => {
    setIsOpen(true);
  };

  const handleLeave = () => {
    setIsOpen(false);
  };

  const handleDropdownToggle = (menuName) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleRouteClick = (route) => {
    if (!route.subRoutes) {
      setOpenMenu(null);
    }
  };

  const hiddenRoles = ["developer", "tester"];
  const developerRole = ["developer"];
  const testerRole = ["tester"];

  return (
    <div
      className="sidebar__container"
      onMouseEnter={isToggle ? handleEnter : null}
      onMouseLeave={isToggle ? handleLeave : null}
    >
      <motion.div
        animate={{
          width: isOpen ? "18rem" : "50px",
          transition: {
            duration: 0.5,
            type: "spring",
            damping: 10,
          },
        }}
        className={`sidebar`}
      >
        <div className="top_section">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                variants={showAnimation}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="logo"
              >
                <div className="bg-transparent flex flex-col items-center justify-center p-4">
                  <Link to={"/"} className="text-center flex flex-col items-center">
                    <img src="/momentum_logo.svg" alt="Momentum Logo" className="w-14 h-14 mb-2 drop-shadow-md" />
                    <h1 className="text-white font-bold text-2xl tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                      Momentum
                    </h1>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-1">
                      Simplify Tasks
                    </p>
                  </Link>
                </div>
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <section className="routes">
          {routes.map((route, index) => {
            if (
              (route.name === "Project Management" || route.name === "User") &&
              hiddenRoles.includes(currentUser?.userRole?.name?.toLowerCase())
            ) {
              return null;
            }

            /* if (
              route.name === "Testing" &&
              developerRole.includes(currentUser?.userRole?.name?.toLowerCase())
            ) {
              return null;
            }

            if (
              route.name === "Tasks" &&
              testerRole.includes(currentUser?.userRole?.name?.toLowerCase())
            ) {
              return null;
            } */

            if (route.subRoutes) {
              return (
                <div key={index}>
                  <SidebarMenu
                    route={route}
                    showAnimation={showAnimation}
                    isOpen={isOpen}
                    openMenu={openMenu}
                    handleDropdownToggle={handleDropdownToggle}
                  />
                </div>
              );
            }

            return (
              <NavLink
                to={route.path}
                key={index}
                className="link"
                onClick={() => handleRouteClick(route)}
              >
                <div className="icon">{route.icon}</div>
                {isOpen && (
                  <motion.div
                    variants={showAnimation}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="link_text"
                  >
                    {route.name}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </section>
      </motion.div>
    </div>
  );
};

export default SideBar;
