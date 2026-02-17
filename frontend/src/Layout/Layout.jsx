import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import "./layout.style.css";
import SideBar from "../components/sidebar/SideBar";
import Topbar from "../components/topbar/Topbar";

const Layout = () => {
  return (
    <main className="layout__container">
      <SideBar />
      <div className="layout__NOF dark:bg-themeBG bg-[#f4f6f8] ">
        <Topbar />
        <Outlet />
      </div>
      {/* <Footer /> */}
    </main>
  );
};

export default Layout;
