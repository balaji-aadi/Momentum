import React from "react";
import { Outlet } from "react-router-dom";

const User = () => {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
};

export default User;
