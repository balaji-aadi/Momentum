import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const menuAnimation = {
  hidden: {
    opacity: 0,
    height: 0,
    padding: 0,
    transition: { duration: 0.3, when: "afterChildren" },
  },
  show: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      when: "beforeChildren",
    },
  },
};

const menuItemAnimation = {
  hidden: (i) => ({
    padding: 0,
    x: "-100%",
    transition: {
      duration: (i + 1) * 0.1,
    },
  }),
  show: (i) => ({
    x: 0,
    transition: {
      duration: (i + 1) * 0.1,
    },
  }),
};

const SidebarMenu = React.memo(
  ({ route, showAnimation, isOpen, openMenu, handleDropdownToggle }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
      setIsMenuOpen(openMenu === route.name);
    }, [openMenu, route.name]);

    const renderSubRoutes = (subRoutes) => {
      return subRoutes.map((subRoute, i) => {
        return (
          <motion.div variants={menuItemAnimation} key={i} custom={i}>
            <NavLink to={subRoute.path} className="link">
              <div className="icon" style={{ paddingLeft: "2rem" }}>
                {subRoute.icon}
              </div>
              {isOpen && (
                <motion.div className="link_text">{subRoute.name}</motion.div>
              )}
            </NavLink>
          </motion.div>
        );
      });
    };

    return (
      <>
        <div className="menu" onClick={() => handleDropdownToggle(route.name)}>
          <div className="menu_item">
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
          </div>
          {isOpen && (
            <motion.div
              animate={isMenuOpen ? { rotate: 0 } : { rotate: -90 }}
              transition={{ duration: 0.3 }}
            >
              <FaAngleDown style={{ cursor: "pointer" }} />
            </motion.div>
          )}
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              variants={menuAnimation}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="menu_container"
            >
              {renderSubRoutes(route.subRoutes)}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

export default SidebarMenu;
