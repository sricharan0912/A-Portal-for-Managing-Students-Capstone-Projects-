import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import StudentSidebar from "./StudentSidebar";
import StudentDashboardView from "./StudentDashboardView";
import BrowseProjectsView from "./BrowseProjectsView";
import PreferencesView from "./PreferencesView";
import GroupView from "./GroupView";
import { useStudentId } from "../hooks/useStudentId";
import { useStudentProjects } from "../hooks/useStudentProjects";
import { useStudentPreferences } from "../hooks/useStudentPreferences";
import { apiCall } from "../utils/apiHelper";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

/**
 * StudentDashboard Component
 * Main container for the student dashboard
 * Uses URL-based navigation for proper browser history support
 */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get student data from localStorage
  const studentData = localStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  // Get numeric student ID using custom hook
  const studentId = useStudentId();

  // Fetch available projects using custom hook
  const { projects, loading: projectsLoading, error: projectsError } =
    useStudentProjects();

  // Fetch and manage preferences using custom hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    submitPreferences,
  } = useStudentPreferences(studentId);

  // Fetch assigned group
  const [assignedGroup, setAssignedGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [submittingPreferences, setSubmittingPreferences] = useState(false);

  // ✅ Determine active view from URL path
  const getActiveFromPath = () => {
    const path = location.pathname;
    if (path.includes("/browse")) return "browse";
    if (path.includes("/preferences")) return "preferences";
    if (path.includes("/group")) return "group";
    return "dashboard"; // default
  };

  const active = getActiveFromPath();

  // ✅ Navigate to different views using URL (adds to browser history)
  const setActive = (view) => {
    const basePath = "/student-dashboard";
    switch (view) {
      case "browse":
        navigate(`${basePath}/browse`);
        break;
      case "preferences":
        navigate(`${basePath}/preferences`);
        break;
      case "group":
        navigate(`${basePath}/group`);
        break;
      case "dashboard":
      default:
        navigate(basePath);
        break;
    }
  };

  // ✅ Redirect if not logged in using useEffect
  useEffect(() => {
    if (!student) {
      navigate("/login", { replace: true });
    }
  }, [student, navigate]);

  // Fetch assigned group on mount
  useEffect(() => {
    if (!studentId) return;

    const loadGroup = async () => {
      try {
        setGroupLoading(true);
        setGroupError(null);

        console.log(
          "StudentDashboard: Fetching group for studentId:",
          studentId
        );

        const data = await apiCall(
          `http://localhost:5050/students/${studentId}/group`,
          { method: "GET" }
        );

        console.log("StudentDashboard: Group data received:", data);
        setAssignedGroup(data);
      } catch (err) {
        console.error("StudentDashboard: Error fetching group:", err);
        setGroupError(err.message);
        setAssignedGroup(null);
      } finally {
        setGroupLoading(false);
      }
    };

    loadGroup();
  }, [studentId]);

  // Handle logout - ✅ Use navigate with replace
  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  // Handle project selection/deselection
  const handleSelectProject = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        // Remove project
        return prev.filter((id) => id !== projectId);
      } else {
        // Add project (max 3)
        if (prev.length < 3) {
          return [...prev, projectId];
        }
        return prev;
      }
    });
  };

  // Handle submit preferences
  const handleSubmitPreferences = async (projectIds) => {
    try {
      setSubmittingPreferences(true);

      // Format preferences with ranking
      const preferencesData = projectIds.map((id, idx) => ({
        project_id: id,
        preference_rank: idx + 1,
      }));

      console.log("StudentDashboard: Submitting preferences:", preferencesData);

      // Submit using hook function
      await submitPreferences(preferencesData);

      // Clear selected projects
      setSelectedProjects([]);

      alert("Preferences submitted successfully!");
    } catch (err) {
      console.error("StudentDashboard: Error submitting preferences:", err);
      alert("Error: " + err.message);
    } finally {
      setSubmittingPreferences(false);
    }
  };

  // Show loading state while checking auth
  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Animation styles
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
    .animate-slideUp {
      animation: slideUp 0.3s ease-out;
    }
  `;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <style>{animationStyles}</style>

      {/* Top Navigation Bar */}
      <DashboardNavbar
        role="student"
        title="Student Dashboard"
        userName={student?.first_name}
        onMenuClick={() => setSidebarOpen((s) => !s)}
        onLogout={handleLogout}
      />

      {/* Sidebar Navigation */}
      <StudentSidebar
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
          {/* Dashboard View */}
          {active === "dashboard" && (
            <StudentDashboardView
              projects={projects}
              preferences={preferences}
              assignedGroup={assignedGroup}
              onNavigate={setActive}
            />
          )}

          {/* Browse Projects View */}
          {active === "browse" && (
            <BrowseProjectsView
              projects={projects}
              selectedProjects={selectedProjects}
              onSelectProject={handleSelectProject}
              loading={projectsLoading}
            />
          )}

          {/* Preferences View */}
          {active === "preferences" && (
            <PreferencesView
              projects={projects}
              preferences={preferences}
              selectedProjects={selectedProjects}
              onSelectProject={handleSelectProject}
              onSubmitPreferences={handleSubmitPreferences}
              loading={submittingPreferences}
            />
          )}

          {/* Group View */}
          {active === "group" && (
            <GroupView
              assignedGroup={assignedGroup}
              loading={groupLoading}
            />
          )}
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