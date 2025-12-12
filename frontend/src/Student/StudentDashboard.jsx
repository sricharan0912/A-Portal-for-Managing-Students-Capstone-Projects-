import { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import StudentSidebar from "./StudentSidebar";
import StudentDashboardView from "./StudentDashboardView";
import BrowseProjectsView from "./BrowseProjectsView";
import PreferencesView from "./PreferencesView";
import GroupView from "./GroupView";
import StudentEvaluationsView from "./StudentEvaluationsView";
import StudentProfileSettingsView from "./StudentProfileSettingsView";
import { useStudentId } from "../hooks/useStudentId";
import { useStudentProjects } from "../hooks/useStudentProjects";
import { useStudentPreferences } from "../hooks/useStudentPreferences";
import { apiCall } from "../utils/apiHelper";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

export default function StudentDashboard() {
  const studentData = localStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;
  const studentId = useStudentId();

  const { projects, loading: projectsLoading, error: projectsError } =
    useStudentProjects();

  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    submitPreferences,
    lastUpdated: preferencesLastUpdated,
  } = useStudentPreferences(studentId);

  const [assignedGroup, setAssignedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [submittingPreferences, setSubmittingPreferences] = useState(false);
  const [preferenceDeadline, setPreferenceDeadline] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    const loadGroupData = async () => {
      try {
        setGroupLoading(true);
        setGroupError(null);
        
        // Load group info
        const groupData = await apiCall(`/students/${studentId}/group`, { method: "GET" });
        setAssignedGroup(groupData.data || groupData);
        
        // Load group members if group exists
        if (groupData.data || (groupData && !groupData.message)) {
          try {
            const membersData = await apiCall(`/students/${studentId}/group/members`, { method: "GET" });
            setGroupMembers(membersData.data || membersData || []);
          } catch (memberErr) {
            console.error("Error loading group members:", memberErr);
            setGroupMembers([]);
          }
        }
      } catch (err) {
        setGroupError(err.message);
        setAssignedGroup(null);
        setGroupMembers([]);
      } finally {
        setGroupLoading(false);
      }
    };
    loadGroupData();
  }, [studentId]);

  // Fetch preference deadline
  useEffect(() => {
    const loadDeadline = async () => {
      try {
        const response = await apiCall("/instructors/settings/preference-deadline", { method: "GET" });
        if (response.success && response.data?.deadline) {
          setPreferenceDeadline(response.data.deadline);
        }
      } catch (err) {
        console.error("Error loading preference deadline:", err);
      }
    };
    loadDeadline();
  }, []);

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Not Logged In</h1>
          <p className="text-slate-600 mb-6">Please log in to access the dashboard</p>
          <a href="/login" className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) return prev.filter((id) => id !== projectId);
      if (prev.length < 3) return [...prev, projectId];
      return prev;
    });
  };

  const handleSubmitPreferences = async (projectIds) => {
    try {
      setSubmittingPreferences(true);
      const preferencesData = projectIds.map((id, idx) => ({
        project_id: id,
        preference_rank: idx + 1,
      }));
      await submitPreferences(preferencesData);
      setSelectedProjects([]);
      alert("Preferences submitted successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingPreferences(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardNavbar
        role="student"
        title="Student Dashboard"
        userName={student?.first_name}
        onMenuClick={() => setSidebarOpen((s) => !s)}
        onLogout={handleLogout}
      />
      <StudentSidebar
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
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
          {active === "dashboard" && (
            <StudentDashboardView
              projects={projects}
              preferences={preferences}
              assignedGroup={assignedGroup}
              onNavigate={setActive}
            />
          )}
          {active === "browse" && (
            <BrowseProjectsView
              projects={projects}
              selectedProjects={selectedProjects}
              onSelectProject={handleSelectProject}
              loading={projectsLoading}
            />
          )}
          {active === "preferences" && (
            <PreferencesView
              projects={projects}
              preferences={preferences}
              selectedProjects={selectedProjects}
              onSelectProject={handleSelectProject}
              onSubmitPreferences={handleSubmitPreferences}
              loading={submittingPreferences}
              deadline={preferenceDeadline}
              lastUpdated={preferencesLastUpdated}
            />
          )}
          {active === "group" && (
            <GroupView 
              assignedGroup={assignedGroup} 
              groupMembers={groupMembers}
              loading={groupLoading} 
            />
          )}
          {active === "evaluations" && (
            <StudentEvaluationsView studentId={studentId} />
          )}
          {active === "profile" && <StudentProfileSettingsView />}
        </main>
      </div>
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Â© 2025 Capstone Hub. All rights reserved. | Contact:{" "}
        <a className="text-blue-600 hover:underline" href="mailto:support@capstonehub.com">
          support@capstonehub.com
        </a>
      </footer>
    </div>
  );
}