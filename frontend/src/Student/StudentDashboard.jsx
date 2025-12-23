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
 * Student Dashboard Component
 * 
 * Main container component for the student portal dashboard.
 * Manages navigation between views, handles project preference selection and submission,
 * displays assigned group information, and coordinates state across child components.
 * 
 * Features:
 * - Multi-view navigation (dashboard, browse projects, preferences, group, evaluations, profile)
 * - Project browsing with up to 3 preference selections
 * - Preference submission with ranking (1st, 2nd, 3rd choice)
 * - Assigned group and team member display
 * - Preference deadline tracking
 * - Responsive sidebar with toggle
 * - Authentication guard with redirect
 * - Automatic data loading on mount
 * 
 * Data Management:
 * - Uses custom hooks for projects, preferences, and student ID
 * - Fetches group assignment and members via API
 * - Loads preference deadline from instructor settings
 * - Handles preference submission with optimistic updates
 * 
 * Available Views:
 * - dashboard: Overview with stats and quick actions
 * - browse: Browse all available projects
 * - preferences: Select and submit project preferences
 * - group: View assigned group and team members
 * - evaluations: View evaluation schedules and results
 * - profile: Student profile settings
 * 
 * @component
 * @returns {React.ReactElement} Student dashboard with navigation and content views
 * 
 * @example
 * // Used in App.jsx routing
 * <Route 
 *   path="/student-dashboard" 
 *   element={<StudentDashboard />} 
 * />
 * 
 * @example
 * // Protected route implementation
 * <Route 
 *   path="/student-dashboard" 
 *   element={
 *     <ProtectedRoute role="student">
 *       <StudentDashboard />
 *     </ProtectedRoute>
 *   } 
 * />
 */
export default function StudentDashboard() {
  /**
   * Retrieve and parse student data from localStorage
   * Contains student information like name, email, and ID
   * @type {string|null}
   */
  const studentData = localStorage.getItem("student");
  
  /**
   * Parsed student object from localStorage
   * @type {Object|null}
   */
  const student = studentData ? JSON.parse(studentData) : null;
  
  /**
   * Get numeric student ID using custom hook
   * Handles both Firebase UID and numeric ID formats
   * @type {number|null}
   */
  const studentId = useStudentId();

  /**
   * Fetch available projects using custom hook
   * Provides approved projects that students can select
   * 
   * @type {Object}
   * @property {Array<Object>} projects - Array of approved project objects
   * @property {boolean} loading - Loading indicator (aliased as projectsLoading)
   * @property {string|null} error - Error message if fetch failed (aliased as projectsError)
   */
  const { projects, loading: projectsLoading, error: projectsError } =
    useStudentProjects();

  /**
   * Fetch and manage student preferences using custom hook
   * Provides preference data and submission functionality
   * 
   * @type {Object}
   * @property {Array<Object>} preferences - Array of submitted preference objects
   * @property {boolean} loading - Loading indicator (aliased as preferencesLoading)
   * @property {string|null} error - Error message (aliased as preferencesError)
   * @property {Function} submitPreferences - Function to submit new preferences
   * @property {string|null} lastUpdated - ISO timestamp of last preference update (aliased as preferencesLastUpdated)
   */
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    submitPreferences,
    lastUpdated: preferencesLastUpdated,
  } = useStudentPreferences(studentId);

  /**
   * State: Assigned group information
   * Contains project assignment and group details
   * @type {Object|null}
   */
  const [assignedGroup, setAssignedGroup] = useState(null);
  
  /**
   * State: Array of group member objects
   * Contains teammate information for assigned group
   * @type {Array<Object>}
   */
  const [groupMembers, setGroupMembers] = useState([]);
  
  /**
   * State: Loading indicator for group data fetch
   * @type {boolean}
   */
  const [groupLoading, setGroupLoading] = useState(false);
  
  /**
   * State: Error message from group data fetch
   * @type {string|null}
   */
  const [groupError, setGroupError] = useState(null);
  
  /**
   * UI State: Controls sidebar visibility
   * @type {boolean}
   */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  /**
   * UI State: Current active view/tab
   * Possible values: 'dashboard', 'browse', 'preferences', 'group', 'evaluations', 'profile'
   * @type {string}
   */
  const [active, setActive] = useState("dashboard");
  
  /**
   * State: Array of selected project IDs for preference submission
   * Maximum of 3 projects can be selected
   * @type {Array<number>}
   */
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  /**
   * State: Loading indicator during preference submission
   * @type {boolean}
   */
  const [submittingPreferences, setSubmittingPreferences] = useState(false);
  
  /**
   * State: Preference submission deadline (ISO datetime string)
   * Loaded from instructor settings
   * @type {string|null}
   */
  const [preferenceDeadline, setPreferenceDeadline] = useState(null);

  /**
   * Effect: Load assigned group and group members on mount
   * 
   * Fetches student's assigned group information and team member details.
   * Handles cases where student is not yet assigned to a group.
   * 
   * Dependencies: [studentId]
   */
  useEffect(() => {
    if (!studentId) return;
    
    /**
     * Internal async function to load group data from API
     * 
     * @async
     * @function loadGroupData
     * @returns {Promise<void>}
     */
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

  /**
   * Effect: Fetch preference submission deadline from instructor settings
   * 
   * Loads the deadline for when students must submit their project preferences.
   * This deadline is set by instructors in course settings.
   * 
   * Dependencies: [] (runs once on mount)
   */
  useEffect(() => {
    /**
     * Internal async function to load preference deadline
     * 
     * @async
     * @function loadDeadline
     * @returns {Promise<void>}
     */
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

  /**
   * Authentication Guard: Redirect if not logged in
   * 
   * Displays login prompt with redirect button if no student data found in localStorage
   * This prevents unauthorized access to the dashboard
   */
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

  /**
   * Handle logout
   * 
   * Clears student data and auth token from localStorage,
   * then redirects to login page
   * 
   * @function handleLogout
   * 
   * @example
   * <button onClick={handleLogout}>Logout</button>
   */
  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  /**
   * Handle project selection toggle
   * 
   * Adds or removes a project from the selected preferences list.
   * Enforces maximum of 3 project selections.
   * 
   * @function handleSelectProject
   * @param {number} projectId - Project ID to toggle selection
   * 
   * @example
   * <ProjectCard 
   *   onSelect={() => handleSelectProject(project.id)}
   *   isSelected={selectedProjects.includes(project.id)}
   * />
   */
  const handleSelectProject = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) return prev.filter((id) => id !== projectId);
      if (prev.length < 3) return [...prev, projectId];
      return prev;
    });
  };

  /**
   * Handle preference submission
   * 
   * Submits ranked project preferences to the API.
   * Project order determines ranking (1st, 2nd, 3rd choice).
   * Clears selected projects and shows success/error feedback.
   * 
   * @async
   * @function handleSubmitPreferences
   * @param {Array<number>} projectIds - Array of project IDs in preference order
   * 
   * @example
   * // Submit preferences in ranked order
   * handleSubmitPreferences([5, 12, 8]) 
   * // Submits: 1st choice = 5, 2nd choice = 12, 3rd choice = 8
   */
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
        © 2025 Capstone Hub. All rights reserved. | Contact:{" "}
        <a className="text-blue-600 hover:underline" href="mailto:support@capstonehub.com">
          support@capstonehub.com
        </a>
      </footer>
    </div>
  );
}