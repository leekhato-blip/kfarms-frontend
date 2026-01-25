import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
      <div className="flex min-h-screen relative bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Topbar />
          <main className="mt-6">{children}</main>
          <footer className="mt-10 bg-white w-full dark:shadow-dark shadow-neo py-4 dark:bg-darkCard text-center text-sm text-lightText dark:text-darkText">
            Made with <span className="text-status-success">❤</span> by ROOTS
          </footer>
        </div>
      </div>
    </div>
  );
}
