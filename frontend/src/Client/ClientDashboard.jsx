import { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import ClientSidebar from "./ClientSidebar";
import DashboardView from "./DashboardView";
import ProjectListView from "./ProjectListView";
import ProjectFormModal from "./ProjectFormModal";
import ClientProfileSettingsView from "./ClientProfileSettingsView";
import ClientTeamsView from "./ClientTeamsView";
import ClientEvaluationsView from "./ClientEvaluationsView";
import { useClientId } from "../hooks/useClientId";
import { useProjects } from "../hooks/useProjects";

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
 * API base URL from environment variables
 * Falls back to localhost if not set
 * @constant {string}
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

/**
 * Client Dashboard Component
 * 
 * Main container component for the client portal dashboard.
 * Manages navigation between different views (dashboard, projects, teams, evaluations, settings),
 * handles project CRUD operations, and coordinates state across child components.
 * 
 * Features:
 * - Multi-view navigation (dashboard, projects, teams, evaluations, settings)
 * - Project management (create, read, update, delete)
 * - Responsive sidebar with toggle functionality
 * - Authentication guard (redirects if not logged in)
 * - Project form modal for create/edit operations
 * - Automatic project data refetching after mutations
 * - Optimistic UI updates
 * 
 * Layout Structure:
 * - Fixed navbar at top
 * - Collapsible sidebar on left
 * - Main content area with view-specific components
 * - Footer at bottom
 * 
 * @component
 * @returns {React.ReactElement} Client dashboard with navigation and content views
 * 
 * @example
 * // Used in App.jsx routing
 * <Route 
 *   path="/client-dashboard" 
 *   element={<ClientDashboard />} 
 * />
 * 
 * @example
 * // Protected route implementation
 * <Route 
 *   path="/client-dashboard" 
 *   element={
 *     <ProtectedRoute role="client">
 *       <ClientDashboard />
 *     </ProtectedRoute>
 *   } 
 * />
 */
export default function ClientDashboard() {
  /**
   * Retrieve and parse client data from localStorage
   * Contains client information like name, email, and ID
   * @type {string|null}
   */
  const clientData = localStorage.getItem("client");
  
  /**
   * Parsed client object from localStorage
   * @type {Object|null}
   */
  const client = clientData ? JSON.parse(clientData) : null;

  /**
   * Get numeric client ID using custom hook
   * Handles both Firebase UID and numeric ID formats
   * @type {number|null}
   */
  const clientId = useClientId();

  /**
   * Fetch and manage projects using custom hook
   * Provides projects array, loading state, errors, and refetch function
   * 
   * @type {Object}
   * @property {Array<Object>} projects - Array of project objects
   * @property {Function} setProjects - State setter for optimistic updates
   * @property {boolean} loading - Loading indicator
   * @property {string|null} error - Error message if fetch failed (aliased as projectsError)
   * @property {Function} refetch - Function to manually reload projects
   */
  const { projects, setProjects, loading, error: projectsError, refetch } =
    useProjects(clientId);

  /**
   * UI State: Controls sidebar visibility
   * @type {boolean}
   */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  /**
   * UI State: Current active view/tab
   * Possible values: 'dashboard', 'projects', 'teams', 'evaluations', 'settings'
   * @type {string}
   */
  const [active, setActive] = useState("dashboard");
  
  /**
   * UI State: Controls visibility of project form modal
   * @type {boolean}
   */
  const [showForm, setShowForm] = useState(false);
  
  /**
   * UI State: Stores project being edited (null for new project)
   * @type {Object|null}
   */
  const [editingProject, setEditingProject] = useState(null);
  
  /**
   * Handle edit project button click
   * 
   * Opens the project form modal in edit mode with selected project data
   * 
   * @function handleEditProject
   * @param {Object} project - Project object to edit
   * 
   * @example
   * <button onClick={() => handleEditProject(selectedProject)}>
   *   Edit Project
   * </button>
   */
  const handleEditProject = (project) => {
    console.log("🔧 Setting editing project in parent:", project);
    setEditingProject(project);
    setShowForm(true);
  };

  /**
   * Authentication Guard: Redirect if not logged in
   * 
   * Displays login prompt with redirect button if no client data found in localStorage
   * This prevents unauthorized access to the dashboard
   */
  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Not Logged In
          </h1>
          <p className="text-slate-600 mb-6">
            Please log in to access the dashboard
          </p>
          
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
          &gt
            Go to Login
          
        </div>
      </div>
    );
  }

  /**
   * Handle logout
   * 
   * Clears client data from localStorage and redirects to login page
   * 
   * @function handleLogout
   * 
   * @example
   * <button onClick={handleLogout}>Logout</button>
   */
  const handleLogout = () => {
    localStorage.removeItem("client");
    window.location.href = "/login";
  };

  /**
   * Handle create new project button click
   * 
   * Opens the project form modal in create mode (no editing project)
   * 
   * @function handleShowForm
   * 
   * @example
   * <button onClick={handleShowForm}>Create New Project</button>
   */
  const handleShowForm = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  /**
   * Handle project form modal close
   * 
   * Closes the modal and clears editing project state
   * 
   * @function handleFormClose
   */
  const handleFormClose = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  /**
   * Handle project form save
   * 
   * Closes the modal, clears editing state, and refetches projects
   * to ensure UI shows latest data from server
   * 
   * @async
   * @function handleFormSave
   * 
   * @example
   * <ProjectFormModal onSave={handleFormSave} />
   */
  const handleFormSave = async () => {
    setShowForm(false);
    setEditingProject(null);
    
    // Refetch projects after save to ensure UI is up-to-date
    await refetchProjects();
  };

  /**
   * Alias for refetch function from useProjects hook
   * Provides semantic naming for project refetching
   * 
   * @function refetchProjects
   * @returns {Promise<void>}
   */
  const refetchProjects = refetch;

  /**
   * Handle new project created event
   * 
   * Implements optimistic UI update by adding project immediately,
   * then refetches all projects to ensure data consistency
   * 
   * @async
   * @function handleProjectCreated
   * @param {Object} newProject - Newly created project object
   * 
   * @example
   * <ProjectFormModal onProjectCreated={handleProjectCreated} />
   */
  const handleProjectCreated = async (newProject) => {
    console.log("🎉 New project created:", newProject);
    
    // Add the new project to state immediately for instant feedback
    setProjects((prev) => [...prev, newProject]);
    
    // Then refetch all projects to ensure we have complete/latest data
    await refetchProjects();
  };

  /**
   * CSS animation styles for form modal
   * Defines fade-in slide-down animation for smooth modal appearance
   * 
   * @constant {string} animationStyles
   */
  const animationStyles = `
    @keyframes fadeInSlideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .form-enter { animation: fadeInSlideDown 400ms ease-out forwards; }
  `;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <style>{animationStyles}</style>

      {/* Top Navigation Bar */}
      <DashboardNavbar
        role="client"
        title="Client Dashboard"
        userName={client?.first_name || client?.name}
        onMenuClick={() => setSidebarOpen((s) => !s)}
        onLogout={handleLogout}
      />

      {/* Sidebar Navigation */}
      <ClientSidebar
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
          {active === "dashboard" && !showForm && (
            <DashboardView
              projects={projects}
              onNavigate={setActive}
            />
          )}

          {/* Projects View */}
          {active === "projects" && !showForm && (
            <ProjectListView
              projects={projects}
              setProjects={setProjects}
              loading={loading}
              clientId={clientId}
              onShowForm={handleEditProject}
              onRefresh={refetchProjects}
            />
          )}

          {/* Project Form Modal */}
          {showForm && (
            <ProjectFormModal
              clientId={clientId}
              projectData={editingProject}
              onSave={handleFormSave}
              onClose={handleFormClose}
              onProjectCreated={handleProjectCreated}
            />
          )}

          {/* Teams View - Using actual ClientTeamsView component */}
          {active === "teams" && <ClientTeamsView clientId={clientId} />}

          {/* Evaluations View - Using actual ClientEvaluationsView component */}
          {active === "evaluations" && <ClientEvaluationsView />}

          {/* Profile Settings View */}
          {active === "settings" && <ClientProfileSettingsView />}
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