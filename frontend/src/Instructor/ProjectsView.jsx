import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/apiHelper";

/**
 * Instructor → Projects View
 * Displays all projects in cards/grid format with search, status filter dropdown, and create project button.
 */
export default function ProjectsView({ instructorId }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects...");
        const res = await apiCall("/projects", { method: "GET" });
        console.log("Projects API response:", res);
        
        // Handle different response formats
        let projectsData = [];
        if (Array.isArray(res)) {
          projectsData = res;
        } else if (res?.data && Array.isArray(res.data)) {
          projectsData = res.data;
        } else if (res?.projects && Array.isArray(res.projects)) {
          projectsData = res.projects;
        }
        
        console.log("Processed projects data:", projectsData);
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [instructorId]);

  // Search and status filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let filtered = projects;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        const status = p.approval_status || "pending";
        return status.toLowerCase() === statusFilter;
      });
    }

    // Apply search filter
    filtered = filtered.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.client_name?.toLowerCase().includes(term) ||
        p.client?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading projects: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row - Title, Search, Filter, Create Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Projects</h2>

        <div className="flex items-center gap-3">
          {/* Search bar - Short */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-44 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
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

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Create Project Button */}
          <button
            onClick={() => navigate("/instructor-dashboard/create-project")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition whitespace-nowrap"
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

      {/* Debug Info - Remove this in production */}
      {projects.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">No projects found in the database.</p>
          <p className="text-yellow-700 text-sm mt-1">
            This could mean:
          </p>
          <ul className="list-disc list-inside text-yellow-700 text-sm mt-2">
            <li>No projects have been created yet</li>
            <li>There's an issue with the API connection</li>
            <li>The authentication token might not have proper permissions</li>
          </ul>
          <p className="text-yellow-700 text-sm mt-3">
            Try creating a new project using the "Create Project" button above.
          </p>
        </div>
      )}

      {/* Project Cards */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Card Header - Title & Status */}
              <div className="p-5 pb-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">
                    {project.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${
                      project.approval_status === "approved"
                        ? "bg-green-100 text-green-700"
                        : project.approval_status === "pending" || !project.approval_status
                        ? "bg-yellow-100 text-yellow-700"
                        : project.approval_status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {project.approval_status || "pending"}
                  </span>
                </div>
              </div>

              {/* Card Body - Fixed Height Content */}
              <div className="px-5 flex-1 flex flex-col">
                {/* Description - Fixed 3 lines */}
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {project.description || "No description provided."}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
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

                {/* Client Info - Compact Single Line */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">
                      {project.client_name || `${project.client_first_name || ''} ${project.client_last_name || ''}`.trim() || 'Unknown Client'}
                      {project.client_organization && (
                        <span className="text-slate-400"> • {project.client_organization}</span>
                      )}
                    </span>
                  </div>
                  {project.client_email && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${project.client_email}`} className="text-blue-600 hover:underline truncate">
                        {project.client_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="flex justify-end items-center border-t border-slate-100 px-5 py-3 bg-slate-50 rounded-b-xl mt-3">
                <button
                  onClick={() => {
                    console.log("Navigating to project:", project.id);
                    navigate(`/instructor-dashboard/projects/${project.id}`);
                  }}
                  className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        projects.length > 0 && (
          <div className="text-center py-10 text-slate-500 text-sm border border-slate-200 bg-white rounded-xl shadow-sm">
            No projects match your filter.
          </div>
        )
      )}
    </div>
  );
}