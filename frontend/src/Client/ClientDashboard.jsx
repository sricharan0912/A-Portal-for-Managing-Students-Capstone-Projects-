import { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import ClientSidebar from "./ClientSidebar";
import DashboardView from "./DashboardView";
import ProjectListView from "./ProjectListView";
import ProjectFormModal from "./ProjectFormModal";
import { useClientId } from "../hooks/useClientId";
import { useProjects } from "../hooks/useProjects";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

/**
 * ClientDashboard Component
 * Main container for the client dashboard
 * Manages all views: dashboard, projects, teams
 * Handles project CRUD operations
 */
export default function ClientDashboard() {
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
  const [active, setActive] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Handle edit/create project - safely handles null for new projects
  const handleEditProject = (project) => {
    console.log("Opening edit modal for project:", project?.id || "NEW");
    setEditingProject(project); // Can be null for new project
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
    console.log("New project created:", newProject);
    
    // Add the new project to state immediately for instant feedback
    if (newProject) {
      setProjects((prev) => [...prev, newProject]);
    }
    
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

  // Teams view placeholder
  const TeamsView = () => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-slate-800">My Teams</h3>
      <p className="mb-4 text-sm text-slate-500">
        This section will show teams assigned to your projects.
      </p>
      <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No teams yet
        <br />
        <span className="text-xs">
          Teams will appear here when projects are assigned.
        </span>
      </div>
    </section>
  );

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
          {active === "teams" && <TeamsView />}
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