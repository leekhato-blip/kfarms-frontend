import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
      <div className="flex min-h-screen relative bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
        <Sidebar />
        <div className="flex-1 px-4 pt-4 pb-0 md:px-6 md:pt-6 md:pb-0 overflow-x-hidden">
          <Topbar />
          <main className="mt-6">{children}</main>
          <footer className="mt-10 -mx-4 md:-mx-6 bg-white w-auto dark:shadow-dark shadow-neo py-4 dark:bg-darkCard text-center text-sm text-lightText dark:text-darkText">
            <div className="px-4 md:px-6">
              Made with <span className="text-status-success">❤</span> by ROOTS
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
