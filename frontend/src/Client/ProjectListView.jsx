import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../components/ui/ProjectCard";
import { apiCall } from "../utils/apiHelper";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function ProjectListView({
  projects = [],
  setProjects,
  loading = false,
  onShowForm,      // (project: object) => void - for editing
  onRefresh,       // optional: () => Promise<void> | void
}) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    console.log("🗑️ Deleting project:", projectId);
    
    try {
      setDeletingId(projectId);
      const response = await apiCall(`${API_BASE_URL}/projects/${projectId}`, { method: "DELETE" });

      console.log("✅ Project deleted successfully:", response);

      // If parent provides a refetch, prefer that (single source of truth)
      if (typeof onRefresh === "function") {
        console.log("🔄 Calling onRefresh to update UI...");
        await onRefresh();
        console.log("✅ UI refreshed");
      } else {
        console.log("📝 Updating local state (fallback)...");
        // Fallback: update local list
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error("❌ Error deleting project:", err);
      alert(`Error deleting project: ${err?.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Edit project - use callback from parent (which navigates to edit URL)
  const handleEditProject = (project) => {
    onShowForm?.(project);
  };

  // ✅ Create new project - navigate to /new URL
  const handleCreateProject = () => {
    navigate("/client-dashboard/projects/new");
  };

  const approvedProjects = projects.filter(
    (p) => p.status === "approved" || p.status === "closed"
  );
  const rejectedProjects = projects.filter((p) => p.status === "rejected");
  const pendingProjects = projects.filter(
    (p) => p.status === "open" || !p.status || p.status === "pending"
  );

  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <svg
              className="h-6 w-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-2xl font-bold text-slate-800">My Projects</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage your proposals and track progress
          </p>
        </div>

        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
            <p className="text-slate-500">Loading projects...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Approved */}
          <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <svg
                  className="h-5 w-5 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Approved Projects</h3>
                <p className="text-xs text-slate-500">Active & completed</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              {approvedProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No approved projects yet</p>
              ) : (
                approvedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    isDeleting={deletingId === project.id}
                  />
                ))
              )}
            </div>
          </section>

          {/* Rejected */}
          <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-red-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2.5">
                <svg
                  className="h-5 w-5 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Rejected Projects</h3>
                <p className="text-xs text-slate-500">Needs revision</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              {rejectedProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No rejected projects</p>
              ) : (
                rejectedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    isDeleting={deletingId === project.id}
                  />
                ))
              )}
            </div>
          </section>

          {/* Pending */}
          <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-yellow-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2.5">
                <svg
                  className="h-5 w-5 text-yellow-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Pending Projects</h3>
                <p className="text-xs text-slate-500">Awaiting proposals</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              {pendingProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No pending projects</p>
              ) : (
                pendingProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    isDeleting={deletingId === project.id}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}