import React, { useState } from "react";
import { Squares2X2Icon } from "@heroicons/react/16/solid";
import { NavLink } from "react-router-dom";
import { Droplets } from "lucide-react";
import {
  Package,
  Leaf,
  PieChart,
  Archive,
  Settings,
  Truck,
  Egg,
  ShoppingCart,
  Menu,
  LogOut,
} from "lucide-react";
import { GiChicken } from "react-icons/gi";

const items = [
  { to: "/", label: "Dashboard", icon: Squares2X2Icon },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/supplies", label: "Supplies", icon: Truck },
  { to: "/fish-ponds", label: "Fish Ponds", icon: Droplets },
  { to: "/livestock", label: "Livestock", icon: GiChicken },
  { to: "/feeds", label: "Feeds", icon: Leaf },
  { to: "/productions", label: "Productions", icon: Egg },
  { to: "/inventory", label: "Inventory", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`
        h-screen p-5 sticky top-0 shadow-soft
        dark:bg-darkCard bg-gray-50
        transition-[width] duration-300 ease-in-out
        flex flex-col
        ${open ? "w-60" : "w-20"}
      `}
    >
      {/* Toggle Button */}
      {!open && (
        <div className="flex justify-center mb-4 font-body">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-accent-primary/25 transition"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      )}

      {/* Header (open state) */}
      <div
        className={`
          transition-all duration-300 overflow-hidden
          ${open ? "opacity-100 max-h-40" : "opacity-0 max-h-0"}
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary text-white flex items-center justify-center font-bold font-header">
              KF
            </div>

            <div>
              <div className="text-lg font-semibold font-header text-gray-800 dark:text-gray-200">
                KFarms
              </div>
              <div className="text-xs font-body text-gray-500 dark:text-gray-400">
                Farm Manager
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-accent-primary/25 transition font-body"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      {/* Closed state logo */}
      {!open && (
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-primary text-white flex items-center justify-center font-bold font-header">
            KF
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 font-body">
        {items.map((it) => {
          const Icon = it.icon;

          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `
  group relative flex items-center gap-3 px-3 py-2 rounded-lg
  border-l-4 transition-all duration-200

  ${
    isActive && open
      ? "bg-accent-primary text-white border-accent-primary"
      : isActive && !open
        ? "border-accent-primary text-accent-primary"
        : open
          ? "border-transparent text-gray-700 dark:text-gray-200 hover:bg-accent-primary/25 hover:text-white"
          : "border-transparent text-gray-700 dark:text-gray-200 hover:border-accent-primary"
  }
`}
            >
              <Icon className="w-7 h-7 flex-shrink-0" />

              {/* Label */}
              <span
                className={`
                  whitespace-nowrap transition-all duration-300
                  ${
                    open
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-3"
                  }
                `}
              >
                {it.label}
              </span>

              {/* Tooltip (collapsed) */}
              {!open && (
                <span
                  className="
                    absolute left-full ml-3 bg-darkCard text-darkText
                    px-3 py-1 rounded-lg text-sm shadow-soft opacity-0
                    group-hover:opacity-100 transition duration-200
                    border border-accent-primary/30 whitespace-nowrap
                  "
                >
                  {it.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button at bottom (mobile only) */}
      <NavLink
        to="/logout"
        className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-accent-primary/25 hover:text-white md:hidden"
      >
        <LogOut className="w-7 h-7" />
        <span className={`${open ? "opacity-100" : "opacity-0"}`}>Logout</span>
      </NavLink>
    </aside>
  );
}
import { TbFish } from "react-icons/tb";
