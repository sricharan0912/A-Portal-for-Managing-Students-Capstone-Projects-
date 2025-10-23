import { useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import InstructorSidebar from "./InstructorSidebar";
import InstructorDashboardView from "./InstructorDashboardView";
import ProjectApprovalView from "./ProjectApprovalView";
import AssignGroupsView from "./AssignGroupsView";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

export default function InstructorDashboard() {
  const instructorData = localStorage.getItem("instructor");
  const instructor = instructorData ? JSON.parse(instructorData) : null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");

  // Redirect to login if not logged in
  if (!instructor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Not Logged In
          </h1>
          <p className="text-slate-600 mb-6">
            Please log in to access the dashboard
          </p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("instructor");
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        role="instructor"
        title="Instructor Dashboard"
        userName={instructor?.name}
        onMenuClick={() => setSidebarOpen((s) => !s)}
        onLogout={handleLogout}
      />

      {/* Sidebar Navigation */}
      <InstructorSidebar
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 px-4 transition-[margin] duration-300 ease-in-out sm:px-6 lg:px-8"
        style={{
          marginTop: `${NAVBAR_HEIGHT}px`,
          marginLeft: sidebarOpen ? `${DRAWER_WIDTH}px` : "0px",
          paddingTop: "1.5rem",
          paddingBottom: "2rem",
        }}
      >
        <main className="mx-auto max-w-7xl pb-8">
          {active === "dashboard" && <InstructorDashboardView />}
          {active === "approval" && <ProjectApprovalView />}
          {active === "groups" && <AssignGroupsView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © 2025 Capstone Hub. All rights reserved. | Contact:{" "}
        <a
          className="text-blue-600 hover:underline"
          href="mailto:support@capstonehub.com"
        >
          support@capstonehub.com
        </a>
      </footer>
    </div>
  );
}
