import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import InstructorSidebar from "./InstructorSidebar";
import InstructorDashboardView from "./InstructorDashboardView";
import ProjectApprovalView from "./ProjectApprovalView";
import AssignGroupsView from "./AssignGroupsView";
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
import CourseSettingsView from "./CourseSettingsView";

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

  // ✅ Determine active view from URL path
  const getActiveFromPath = () => {
    const path = location.pathname;
    
    if (path.includes("/add-student")) return "add-student";
    if (path.includes("/students")) return "students";
    if (path.includes("/create-project")) return "create-project";
    if (path.includes("/projects/")) return "project-details";
    if (path.includes("/projects")) return "projects";
    if (path.includes("/approval")) return "approval";
    if (path.includes("/auto-groups")) return "auto-groups";
    if (path.includes("/create-group")) return "create-group";
    if (path.includes("/manage-groups")) return "manage-groups";
    if (path.includes("/groups")) return "groups";
    if (path.includes("/schedule-evaluation")) return "schedule-evaluation";
    if (path.includes("/evaluations")) return "evaluations";
    if (path.includes("/settings")) return "settings";
    if (path.includes("/profile")) return "profile";
    return "dashboard";
  };

  const active = getActiveFromPath();

  // ✅ Navigate to different views using URL (adds to browser history)
  const setActive = (view) => {
    const basePath = "/instructor-dashboard";
    switch (view) {
      case "students":
        navigate(`${basePath}/students`);
        break;
      case "add-student":
        navigate(`${basePath}/add-student`);
        break;
      case "projects":
        navigate(`${basePath}/projects`);
        break;
      case "create-project":
        navigate(`${basePath}/create-project`);
        break;
      case "approval":
        navigate(`${basePath}/approval`);
        break;
      case "groups":
        navigate(`${basePath}/groups`);
        break;
      case "manage-groups":
        navigate(`${basePath}/manage-groups`);
        break;
      case "auto-groups":
        navigate(`${basePath}/auto-groups`);
        break;
      case "create-group":
        navigate(`${basePath}/create-group`);
        break;
      case "evaluations":
        navigate(`${basePath}/evaluations`);
        break;
      case "schedule-evaluation":
        navigate(`${basePath}/schedule-evaluation`);
        break;
      case "settings":
        navigate(`${basePath}/settings`);
        break;
      case "profile":
        navigate(`${basePath}/profile`);
        break;
      case "logout":
        handleLogout();
        break;
      case "dashboard":
      default:
        navigate(basePath);
        break;
    }
  };

  // ✅ Redirect if not logged in using useEffect
  useEffect(() => {
    if (!instructor || !instructorId) {
      navigate("/login", { replace: true });
    }
  }, [instructor, instructorId, navigate]);

  // Handle logout - ✅ Use navigate with replace
  const handleLogout = () => {
    localStorage.removeItem("instructor");
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  // Show loading state while checking auth
  if (!instructor || !instructorId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
          {/* Existing sections */}
          {active === "dashboard" && <InstructorDashboardView instructorId={instructorId} />}
          {active === "approval" && <ProjectApprovalView instructorId={instructorId} />}
          {active === "groups" && <GroupsView instructorId={instructorId} />}

          {/* New sections */}
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
          {active === "settings" && <CourseSettingsView />}
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