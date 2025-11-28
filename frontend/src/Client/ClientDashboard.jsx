import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
 * Uses URL-based navigation for proper browser history support
 * Modal state is also URL-controlled for back button support
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
  const [editingProject, setEditingProject] = useState(null);

  // ✅ Determine active view AND modal state from URL path
  const getStateFromPath = () => {
    const path = location.pathname;
    
    // Check for modal routes first
    if (path.includes("/projects/new")) {
      return { active: "projects", showForm: true, isEditing: false };
    }
    if (path.includes("/projects/edit/")) {
      const projectId = path.split("/projects/edit/")[1];
      return { active: "projects", showForm: true, isEditing: true, projectId };
    }
    
    // Regular routes
    if (path.includes("/projects")) return { active: "projects", showForm: false };
    if (path.includes("/teams")) return { active: "teams", showForm: false };
    return { active: "dashboard", showForm: false };
  };
  
  const { active, showForm, isEditing, projectId } = getStateFromPath();

  // ✅ Load project data when editing (URL has project ID)
  useEffect(() => {
    if (isEditing && projectId && projects.length > 0) {
      const project = projects.find(p => String(p.id) === String(projectId));
      if (project) {
        setEditingProject(project);
      }
    } else if (!showForm) {
      setEditingProject(null);
    }
  }, [isEditing, projectId, projects, showForm]);

  // ✅ Navigate to different views using URL (adds to browser history)
  const setActive = (view) => {
    const basePath = "/client-dashboard";
    switch (view) {
      case "projects":
        navigate(`${basePath}/projects`);
        break;
      case "teams":
        navigate(`${basePath}/teams`);
        break;
      case "dashboard":
      default:
        navigate(basePath);
        break;
    }
  };

  // ✅ Redirect if not logged in using useEffect
  useEffect(() => {
    if (!client) {
      navigate("/login", { replace: true });
    }
  }, [client, navigate]);
  
  // ✅ Open edit modal - navigates to edit URL
  const handleEditProject = (project) => {
    console.log("📝 Opening edit modal for project:", project);
    setEditingProject(project);
    navigate(`/client-dashboard/projects/edit/${project.id}`);
  };

  // ✅ Open create modal - navigates to new URL
  const handleShowForm = () => {
    setEditingProject(null);
    navigate("/client-dashboard/projects/new");
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("client");
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  // ✅ Close modal - navigates back to projects list
  const handleFormClose = () => {
    setEditingProject(null);
    navigate("/client-dashboard/projects");
  };

  // Handle form save
  const handleFormSave = async () => {
    setEditingProject(null);
    await refetchProjects();
    navigate("/client-dashboard/projects");
  };

  const refetchProjects = refetch;

  const handleProjectCreated = async (newProject) => {
    console.log("🎉 New project created:", newProject);
    setProjects((prev) => [...prev, newProject]);
    await refetchProjects();
  };

  // Show loading state while checking auth
  if (!client) {
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
              onCreateNew={handleShowForm}
              onRefresh={refetchProjects}
            />
          )}

          {/* Project Form Modal - shown based on URL */}
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