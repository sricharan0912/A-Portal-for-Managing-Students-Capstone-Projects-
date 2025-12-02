import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import StudentSidebar from "./StudentSidebar";
import StudentDashboardView from "./StudentDashboardView";
import BrowseProjectsView from "./BrowseProjectsView";
import PreferencesView from "./PreferencesView";
import GroupView from "./GroupView";
import StudentEvaluationsView from "./StudentEvaluationsView";
import { useStudentId } from "../hooks/useStudentId";
import { useStudentProjects } from "../hooks/useStudentProjects";
import { useStudentPreferences } from "../hooks/useStudentPreferences";
import { apiCall } from "../utils/apiHelper";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

// Valid views for URL routing
const VALID_VIEWS = ["dashboard", "browse", "preferences", "group", "evaluations"];

/**
 * StudentDashboard Component
 * Main container for the student dashboard
 * Uses URL-based navigation for proper back button support
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
    lastUpdated: preferencesLastUpdated,
    deadline: preferencesDeadline,
  } = useStudentPreferences(studentId);

  // Fetch assigned group
  const [assignedGroup, setAssignedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [submittingPreferences, setSubmittingPreferences] = useState(false);

  // Get active view from URL query parameter
  const getActiveFromURL = () => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    return VALID_VIEWS.includes(view) ? view : "dashboard";
  };

  const active = getActiveFromURL();

  // Navigate to a view by updating URL
  const setActive = (view) => {
    if (view === "dashboard") {
      navigate("/student-dashboard");
    } else {
      navigate(`/student-dashboard?view=${view}`);
    }
  };

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

        const response = await apiCall(
          `http://localhost:5050/students/${studentId}/group`,
          { method: "GET" }
        );

        console.log("StudentDashboard: Group data received:", response);
        // Extract the actual data from the response
        const groupData = response.data || null;
        setAssignedGroup(groupData);

        // If group exists, also fetch group members
        if (groupData) {
          try {
            const membersResponse = await apiCall(
              `http://localhost:5050/students/${studentId}/group/members`,
              { method: "GET" }
            );
            console.log("StudentDashboard: Group members received:", membersResponse);
            setGroupMembers(membersResponse.data || []);
          } catch (membersErr) {
            console.error("Error fetching group members:", membersErr);
            setGroupMembers([]);
          }
        }
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

  // Redirect if not logged in
  if (!student) {
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
    localStorage.removeItem("student");
    window.location.href = "/login";
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
              deadline={preferencesDeadline}
              lastUpdated={preferencesLastUpdated}
            />
          )}

          {/* Group View */}
          {active === "group" && (
            <GroupView
              assignedGroup={assignedGroup}
              groupMembers={groupMembers}
              loading={groupLoading}
            />
          )}

          {/* Evaluations View */}
          {active === "evaluations" && (
            <StudentEvaluationsView />
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