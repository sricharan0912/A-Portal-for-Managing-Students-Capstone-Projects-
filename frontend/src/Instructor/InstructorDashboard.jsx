// src/instructor/InstructorDashboard.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import InstructorSidebar from "./InstructorSidebar";
import InstructorDashboardView from "./InstructorDashboardView";
import ProjectApprovalView from "./ProjectApprovalView";
import AssignGroupsView from "./AssignGroupsView";

// Newly added imports for the new instructor sections
import StudentsView from "./StudentsView";
import AddStudentForm from "./AddStudentForm";
import ProjectsView from "./ProjectsView";
import ProjectDetailsView from "./ProjectDetailsView";
import CreateProjectForm from "./CreateProjectForm";
import GroupsView from "./GroupsView";
import AutoGroupFormationView from "./AutoGroupFormationView";
import CreateGroupForm from "./CreateGroupForm";
import EvaluationsView from "./EvaluationsView";
import ScheduleEvaluationForm from "./ScheduleEvaluationForm";
import ProfileSettingsView from "./ProfileSettingsView";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

export default function InstructorDashboard() {
  const instructorData = localStorage.getItem("instructor");
  const instructor = instructorData ? JSON.parse(instructorData) : null;

  // Extract instructor ID (numeric database ID)
  const instructorId = instructor?.id || null;
  
  // Combine first_name and last_name for display
  const instructorName = instructor?.first_name && instructor?.last_name
    ? `${instructor.first_name} ${instructor.last_name}`
    : instructor?.name || "Instructor";

  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");

  // ✅ Sync active state with URL route
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes("/add-student")) {
      setActive("add-student");
    } else if (path.includes("/students")) {
      setActive("students");
    } else if (path.includes("/create-project")) {
      setActive("create-project");
    } else if (path.includes("/projects/")) {
      setActive("project-details");
    } else if (path.includes("/projects")) {
      setActive("projects");
    } else if (path.includes("/approval")) {
      setActive("approval");
    } else if (path.includes("/auto-groups")) {
      setActive("auto-groups");
    } else if (path.includes("/create-group")) {
      setActive("create-group");
    } else if (path.includes("/manage-groups")) {
      setActive("manage-groups");
    } else if (path.includes("/groups")) {
      setActive("groups");
    } else if (path.includes("/schedule-evaluation")) {
      setActive("schedule-evaluation");
    } else if (path.includes("/evaluations")) {
      setActive("evaluations");
    } else if (path.includes("/profile")) {
      setActive("profile");
    } else {
      setActive("dashboard");
    }
  }, [location.pathname]);

  // Redirect to login if not logged in
  if (!instructor || !instructorId) {
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
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        role="instructor"
        title="Instructor Dashboard"
        userName={instructorName}
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
          {/* Existing sections - now with instructorId prop */}
          {active === "dashboard" && <InstructorDashboardView instructorId={instructorId} />}
          {active === "approval" && <ProjectApprovalView instructorId={instructorId} />}
          {active === "groups" && <AssignGroupsView instructorId={instructorId} />}

          {/* New sections - now with instructorId prop */}
          {active === "students" && <StudentsView instructorId={instructorId} />}
          {active === "add-student" && <AddStudentForm instructorId={instructorId} />}
          {active === "projects" && <ProjectsView instructorId={instructorId} />}
          {active === "project-details" && <ProjectDetailsView instructorId={instructorId} />}
          {active === "create-project" && <CreateProjectForm instructorId={instructorId} />}
          {active === "manage-groups" && <GroupsView instructorId={instructorId} />}
          {active === "auto-groups" && <AutoGroupFormationView instructorId={instructorId} />}
          {active === "create-group" && <CreateGroupForm instructorId={instructorId} />}
          {active === "evaluations" && <EvaluationsView instructorId={instructorId} />}
          {active === "schedule-evaluation" && <ScheduleEvaluationForm instructorId={instructorId} />}
          {active === "profile" && <ProfileSettingsView instructorId={instructorId} />}
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