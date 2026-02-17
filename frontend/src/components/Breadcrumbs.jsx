import React from "react";
import { Link } from "react-router-dom";
import { PiHouseLight } from "react-icons/pi";

const Breadcrumbs = ({ breadcrumbs }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm dark:text-themeText text-gray-800 mb-10">
      <PiHouseLight className="text-2xl" />
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index}>
          <span></span>
          <Link
            to={breadcrumb?.path}
            className="hover:text-[#7095c2] "
            onClick={breadcrumb?.handleClicked}
          >
            {breadcrumb?.label}
          </Link>
          {index < breadcrumbs.length - 1 && (
            <span className="text-gray-400"> / </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
