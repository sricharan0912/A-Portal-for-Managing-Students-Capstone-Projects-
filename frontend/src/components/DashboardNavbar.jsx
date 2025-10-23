// src/components/DashboardNavbar.jsx
import React from "react";

/**
 * Reusable top app bar for all dashboards.
 * - role: "client" | "student" | "instructor" (controls color theme)
 * - title: page title (e.g., "Client Dashboard")
 * - userName: optional user display (e.g., "Charan T")
 * - onMenuClick: open/close sidebar
 * - onLogout: sign out action
 * - rightSlots: optional extra JSX on the right (filters, buttons, etc.)
 */
export default function DashboardNavbar({
  role = "client",
  title = "Dashboard",
  userName = "",
  onMenuClick = () => {},
  onLogout = () => {},
  rightSlots = null,
}) {
  const theme = {
    client: {
      bg: "bg-blue-900",
      badge: "bg-blue-800 text-blue-100",
      ring: "focus:ring-blue-300",
    },
    student: {
      bg: "bg-blue-900",
      badge: "bg-blue-800 text-blue-100",
      ring: "focus:ring-blue-300",
    },
    instructor: {
      bg: "bg-blue-900",
      badge: "bg-blue-800 text-blue-100",
      ring: "focus:ring-blue-300",
    },
  }[role] || {
    bg: "bg-gray-900",
    badge: "bg-gray-800 text-gray-100",
    ring: "focus:ring-gray-300",
  };

  return (
    <header className={`sticky top-0 z-40 ${theme.bg} text-white shadow`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: hamburger + title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 ${theme.ring}`}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
            {userName ? (
              <span className="hidden text-sm font-normal opacity-70 sm:inline">
                • {userName}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: optional slots + logout */}
        <div className="flex items-center gap-2">
          {rightSlots}
          {/* Modern logout icon button */}
          <button
            onClick={onLogout}
            aria-label="Logout"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-red-500 text-white shadow-md transition-all hover:bg-red-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            title="Logout"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}