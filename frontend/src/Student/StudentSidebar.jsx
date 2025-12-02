const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

/**
 * StudentSidebar Component
 * Navigation sidebar for student dashboard with collapsible menu
 *
 * @param {string} active - Currently active section ID
 * @param {function} setActive - Function to change active section
 * @param {boolean} sidebarOpen - Whether sidebar is open on mobile
 * @param {function} setSidebarOpen - Function to toggle sidebar
 */
export default function StudentSidebar({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
}) {
  /**
   * NavItem Component
   * Individual navigation item with icon and label
   */
  const NavItem = ({ id, icon, label }) => {
    const isActive = active === id;
    return (
      <button
        onClick={() => {
          setActive(id);
          // Close sidebar on mobile after selecting
          if (window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
          isActive
            ? "bg-blue-800 text-white"
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center">
          {icon}
        </span>
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className="fixed left-0 z-40 h-[calc(100vh-64px)] bg-blue-900 text-blue-50 shadow-xl transition-transform duration-300 ease-in-out"
        style={{
          top: `${NAVBAR_HEIGHT}px`,
          width: `${DRAWER_WIDTH}px`,
          transform: sidebarOpen
            ? "translateX(0px)"
            : `translateX(-${DRAWER_WIDTH}px)`,
        }}
      >
        <div className="space-y-5 p-4">
          {/* Portal Header */}
          <div className="px-1">
            <p className="text-xs uppercase tracking-wide text-blue-200">
              Student Portal
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <NavItem
              id="dashboard"
              label="My Dashboard"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />

            <NavItem
              id="browse"
              label="Browse Projects"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              }
            />

            <NavItem
              id="preferences"
              label="My Preferences"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />

            <NavItem
              id="group"
              label="My Group"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />

            <NavItem
              id="evaluations"
              label="Evaluations"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ top: `${NAVBAR_HEIGHT}px` }}
        />
      )}
    </>
  );
}