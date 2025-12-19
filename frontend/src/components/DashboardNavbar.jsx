import React from "react";

/**
 * DashboardNavbar - unified for all portals.
 */
export default function DashboardNavbar({
  role = "client",
  title = "Dashboard",
  userName = "",
  onMenuClick = () => {},
  onLogout = () => {},
}) {
  // Color theme per role
  const theme = {
    client: {
      bg: "bg-blue-900",
      text: "text-white",
      ring: "focus:ring-blue-300",
    },
    student: {
      bg: "bg-blue-900",
      text: "text-white",
      ring: "focus:ring-blue-300",
    },
    instructor: {
      bg: "bg-blue-900",
      text: "text-white",
      ring: "focus:ring-blue-300",
    },
  }[role] || {
    bg: "bg-gray-900",
    text: "text-white",
    ring: "focus:ring-gray-300",
  };

  return (
    <header className={`sticky top-0 z-40 ${theme.bg} ${theme.text} shadow`}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 ${theme.ring}`}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            {userName && (
              <p className="text-xs text-blue-200">Welcome, {userName}</p>
            )}
          </div>
        </div>

        {/* Right: Logout Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
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