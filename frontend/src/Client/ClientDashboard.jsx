import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import ClientSidebar from "./ClientSidebar";
import DashboardView from "./DashboardView";
import ProjectListView from "./ProjectListView";
import ProjectFormModal from "./ProjectFormModal";
import ClientEvaluationsView from "./ClientEvaluationsView";
import ClientTeamsView from "./ClientTeamsView";
import { useClientId } from "../hooks/useClientId";
import { useProjects } from "../hooks/useProjects";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

// Valid views for URL routing
const VALID_VIEWS = ["dashboard", "projects", "teams", "evaluations"];

/**
 * ClientDashboard Component
 * Main container for the client dashboard
 * Uses URL-based navigation for proper back button support
 */
export default function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get client data from localStorage
  const clientData = localStorage.getItem("client");
  const client = clientData ? JSON.parse(clientData) : null;

  // Get numeric client ID using custom hook
  const clientId = useClientId();

  // Fetch projects using custom hook
  const { projects, setProjects, loading, error: projectsError, refetch } =
    useProjects(clientId);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

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
      navigate("/client-dashboard");
    } else {
      navigate(`/client-dashboard?view=${view}`);
    }
  };

  const handleEditProject = (project) => {
    console.log("🔏 Setting editing project in parent:", project);
    setEditingProject(project);
    setShowForm(true);
  };

  // Redirect if not logged in
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
    localStorage.removeItem("client");
    window.location.href = "/login";
  };

  // Handle show form for creating new project
  const handleShowForm = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  // Handle form save
  const handleFormSave = async () => {
    setShowForm(false);
    setEditingProject(null);
    
    // Refetch projects after save to ensure UI is up-to-date
    await refetchProjects();
  };

  // Use the refetch function from useProjects hook
  const refetchProjects = refetch;

  // Handle new project created with immediate refetch
  const handleProjectCreated = async (newProject) => {
    console.log("🎉 New project created:", newProject);
    
    // Add the new project to state immediately for instant feedback
    setProjects((prev) => [...prev, newProject]);
    
    // Then refetch all projects to ensure we have complete/latest data
    await refetchProjects();
  };

  // Animation styles
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
        userName={client?.name}
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

          {/* Teams View */}
          {active === "teams" && <ClientTeamsView clientId={clientId} />}

          {/* Evaluations View */}
          {active === "evaluations" && <ClientEvaluationsView />}
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