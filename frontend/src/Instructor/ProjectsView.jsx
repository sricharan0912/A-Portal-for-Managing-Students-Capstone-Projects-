import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstructorProjects } from "../utils/apiHelper";

/**
 * Instructor → Projects View
 * Displays all projects in cards/grid format with search + create project button.
 */
export default function ProjectsView({ instructorId }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!instructorId) {
        console.error("No instructor ID provided");
        setLoading(false);
        return;
      }

      try {
        const res = await getInstructorProjects(instructorId);
        const data = res.data || [];
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [instructorId]);

  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProjects(
      projects.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.client?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Projects</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>

          {/* Create Project Button - ✅ Fixed to use navigate */}
          <button
            onClick={() => navigate("/instructor-dashboard/create-project")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition"
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
      </div>

      {/* Project Cards */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {project.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      project.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : project.status === "open"
                        ? "bg-yellow-100 text-yellow-700"
                        : project.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {project.description || "No description provided."}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.category && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {project.category}
                    </span>
                  )}
                  {project.complexity_level && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {project.complexity_level}
                    </span>
                  )}
                  {project.team_size && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      Team: {project.team_size}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions - ✅ Fixed to use navigate */}
              <div className="flex justify-between items-center border-t border-slate-100 px-5 py-3 bg-slate-50 rounded-b-xl">
                <button
                  onClick={() => navigate(`/instructor-dashboard/projects/${project.id}`)}
                  className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </button>

                {project.status === "open" && (
                  <div className="flex gap-2">
                    <button
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                      onClick={() => alert(`Approved ${project.title}`)}
                    >
                      Approve
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={() => alert(`Rejected ${project.title}`)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 text-sm border border-slate-200 bg-white rounded-xl shadow-sm">
          No projects found.
        </div>
      )}
    </div>
  );
}
