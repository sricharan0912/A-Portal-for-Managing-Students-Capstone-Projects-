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

/**
 * Layout constant: Height of the top navigation bar in pixels
 * Used for calculating content area margins
 * @constant {number}
 */
const NAVBAR_HEIGHT = 64;

/**
 * Layout constant: Width of the sidebar drawer in pixels when open
 * Used for calculating content area margins
 * @constant {number}
 */
const DRAWER_WIDTH = 280;

/**
 * Instructor Dashboard Component
 * 
 * Main container component for the instructor portal dashboard.
 * Manages navigation between multiple views including project approvals, student management,
 * group formation, evaluations, and settings. Uses URL-based routing for proper browser
 * history and deep linking support.
 * 
 * Features:
 * - URL-based routing with React Router for proper navigation history
 * - Multi-view navigation (dashboard, students, projects, groups, evaluations, settings)
 * - Project approval workflow
 * - Automated and manual group formation
 * - Student management (view, add)
 * - Evaluation scheduling
 * - Responsive sidebar with toggle
 * - Authentication guard with redirect
 * - Profile and course settings
 * 
 * Available Views:
 * - dashboard: Overview stats and quick actions
 * - students: Student list view
 * - add-student: Add new student form
 * - projects: All projects view
 * - project-details: Individual project details
 * - create-project: Create new project form
 * - approval: Project approval queue
 * - groups: View all groups
 * - manage-groups: Group management interface
 * - auto-groups: Automated group formation
 * - create-group: Manual group creation
 * - evaluations: Evaluation list
 * - schedule-evaluation: Schedule new evaluation
 * - settings: Course settings
 * - profile: Instructor profile settings
 * 
 * @component
 * @returns {React.ReactElement} Instructor dashboard with URL-based routing
 * 
 * @example
 * // Used in App.jsx routing
 * <Route 
 *   path="/instructor-dashboard/*" 
 *   element={<InstructorDashboard />} 
 * />
 * 
 * @example
 * // Direct navigation to specific view
 * <Link to="/instructor-dashboard/approval">Project Approvals</Link>
 * 
 * @example
 * // Protected route implementation
 * <Route 
 *   path="/instructor-dashboard/*" 
 *   element={
 *     <ProtectedRoute role="instructor">
 *       <InstructorDashboard />
 *     </ProtectedRoute>
 *   } 
 * />
 */
export default function InstructorDashboard() {
  /**
   * Retrieve and parse instructor data from localStorage
   * Contains instructor information like name, email, and ID
   * @type {string|null}
   */
  const instructorData = localStorage.getItem("instructor");
  
  /**
   * Parsed instructor object from localStorage
   * @type {Object|null}
   */
  const instructor = instructorData ? JSON.parse(instructorData) : null;

  /**
   * Extract numeric instructor database ID
   * Used for API calls and data fetching
   * @type {number|null}
   */
  const instructorId = instructor?.id || null;
  
  /**
   * Combine first_name and last_name for display in navbar
   * Falls back to name field or generic "Instructor" if not available
   * @type {string}
   */
  const instructorName = instructor?.first_name && instructor?.last_name
    ? `${instructor.first_name} ${instructor.last_name}`
    : instructor?.name || "Instructor";

  /**
   * React Router location hook for accessing current URL
   * Used to determine active view from pathname
   * @type {Location}
   */
  const location = useLocation();
  
  /**
   * React Router navigation hook for programmatic navigation
   * Used to change views and handle redirects
   * @type {NavigateFunction}
   */
  const navigate = useNavigate();
  
  /**
   * UI State: Controls sidebar visibility
   * @type {boolean}
   */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Determine active view from current URL path
   * 
   * Parses the current pathname to identify which view should be displayed.
   * Checks URL segments in priority order to match the most specific route first.
   * 
   * @function getActiveFromPath
   * @returns {string} Active view identifier
   * 
   * @example
   * // URL: /instructor-dashboard/approval
   * getActiveFromPath() // Returns: "approval"
   * 
   * @example
   * // URL: /instructor-dashboard/projects/123
   * getActiveFromPath() // Returns: "project-details"
   */
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

  /**
   * Current active view based on URL path
   * Automatically updates when URL changes
   * @type {string}
   */
  const active = getActiveFromPath();

  /**
   * Navigate to different views using URL routing
   * 
   * Updates the browser URL to reflect the selected view, which adds to browser history
   * and enables proper back/forward button functionality. Each view has a unique URL path.
   * 
   * @function setActive
   * @param {string} view - View identifier to navigate to
   * 
   * @example
   * // Navigate to students view
   * setActive('students') // URL becomes: /instructor-dashboard/students
   * 
   * @example
   * // Navigate to approval view
   * setActive('approval') // URL becomes: /instructor-dashboard/approval
   * 
   * @example
   * // Logout action
   * setActive('logout') // Clears localStorage and redirects to login
   */
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

  /**
   * Effect: Redirect to login if not authenticated
   * 
   * Checks for valid instructor data and ID on mount and whenever they change.
   * Uses replace: true to prevent adding to browser history (can't go back to dashboard).
   * 
   * Dependencies: [instructor, instructorId, navigate]
   */
  useEffect(() => {
    if (!instructor || !instructorId) {
      navigate("/login", { replace: true });
    }
  }, [instructor, instructorId, navigate]);

  /**
   * Handle logout
   * 
   * Clears instructor data and auth token from localStorage,
   * then redirects to login page with replace navigation
   * 
   * @function handleLogout
   * 
   * @example
   * <button onClick={handleLogout}>Logout</button>
   */
  const handleLogout = () => {
    localStorage.removeItem("instructor");
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  /**
   * Loading State: Show while authentication check is in progress
   * 
   * Displays loading spinner during the brief moment when authentication
   * is being verified and before redirect to login occurs
   */
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
        
          className="text-blue-600 hover:underline"
          href="mailto:support@capstonehub.com"
        &gt
          support@capstonehub.com
        
      </footer>
    </div>
  );
}