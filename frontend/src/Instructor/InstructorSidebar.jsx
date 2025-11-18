const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

/**
 * InstructorSidebar Component
 * Extended navigation sidebar (Dashboard, Students, Projects, Groups, Evaluations, Profile)
 * Retains your existing blue design & layout
 */
export default function InstructorSidebar({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
}) {
  const NavItem = ({ id, icon, label }) => {
    const isActive = active === id;
    return (
      <button
        onClick={() => {
          setActive(id);
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
              Instructor Portal
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <NavItem
              id="dashboard"
              label="Dashboard"
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
                    d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m-4 0h8a2 2 0 002-2v-6"
                  />
                </svg>
              }
            />

            <NavItem
              id="students"
              label="Students"
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
                    d="M17 20h5V8H2v12h5m10 0v-6m0 6H9m0 0v-6"
                  />
                </svg>
              }
            />

            <NavItem
              id="projects"
              label="Projects"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8l6 6v4a2 2 0 01-2 2h-2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16v4h8v-4m-8 0h8"
                  />
                </svg>
              }
            />

            <NavItem
              id="groups"
              label="Groups"
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
                    d="M17 20h5V8H2v12h5m10 0v-6m0 6H9m0 0v-6"
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
                    d="M8 7V3m8 4V3m-9 8h10m-5 4h5M4 21h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            <NavItem
              id="profile"
              label="Profile Settings"
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
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4S8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
              }
            />

            {/* Logout Button */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <NavItem
                id="logout"
                label="Logout"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                    />
                  </svg>
                }
              />
            </div>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
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
