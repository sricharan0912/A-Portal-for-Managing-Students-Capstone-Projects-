import React from "react";

/**
 * DashboardNavbar — unified for all portals.
 * Shows extra tools (search, filter, schedule) only for instructors.
 */
export default function DashboardNavbar({
  role = "client",
  title = "Dashboard",
  userName = "",
  onMenuClick = () => {},
  onLogout = () => {},
  onFilterClick = () => {},
  onScheduleClick = () => {},
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
        <div className="flex items-center gap-4 w-full max-w-xl">
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

          {/* Only for Instructor: Search Bar */}
          {role === "instructor" && (
            <div className="ml-6 flex-1 hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students, projects..."
                  className="w-full rounded-lg bg-blue-800/60 px-4 py-2 text-sm placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="absolute right-3 top-2.5 text-blue-200">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-3">
          {/* Only for Instructor: Filter + Schedule */}
          {role === "instructor" && (
            <>
              <button
                onClick={onFilterClick}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 7v7l-4-2v-5l-7-7V4z"
                  />
                </svg>
                Filter
              </button>

              <button
                onClick={onScheduleClick}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10m-5 4h5M4 21h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Schedule Evaluation
              </button>
            </>
          )}

          {/* Logout Button */}
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
