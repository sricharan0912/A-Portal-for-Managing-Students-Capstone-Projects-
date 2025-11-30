import { useState } from "react";
import ProjectCard from "../components/ui/ProjectCard";

/**
 * BrowseProjectsView Component
 * Displays all available projects with detailed view modal
 * Students can view project details and select preferences
 *
 * @param {array} projects - Array of available project objects
 * @param {array} selectedProjects - Array of selected project IDs
 * @param {function} onSelectProject - Callback when project is selected/deselected
 * @param {boolean} loading - Loading state
 */
export default function BrowseProjectsView({
  projects = [],
  selectedProjects = [],
  onSelectProject,
  loading,
}) {
  const [viewingProject, setViewingProject] = useState(null);

  const handleSelectProject = (projectId) => {
    onSelectProject(projectId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h2 className="text-2xl font-bold text-slate-800">
            Available Projects
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Click on projects to view details and select your top 3 preferences
        </p>
      </div>

      {/* Selection Counter */}
      {selectedProjects.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{selectedProjects.length}</span> of{" "}
            <span className="font-semibold">3</span> preferences selected
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(selectedProjects.length / 3) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
            <p className="text-slate-500">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h4 className="text-lg font-semibold text-slate-700 mb-2">
            No projects available yet
          </h4>
          <p className="text-slate-600">
            Projects will appear here once they're posted by clients
          </p>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="relative">
              {/* Selected Rank Badge */}
              {selectedProjects.includes(project.id) && (
                <div className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg">
                  {selectedProjects.indexOf(project.id) + 1}
                </div>
              )}

              {/* Project Card with View Details Button */}
              <div
                className={`rounded-lg border-2 p-4 transition cursor-pointer ${
                  selectedProjects.includes(project.id)
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">
                    {project.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {project.description}
                </p>

                {/* Meta Tags */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {project.category && (
                    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {project.category}
                    </span>
                  )}
                  {project.complexity_level && (
                    <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      {project.complexity_level}
                    </span>
                  )}
                </div>

                {/* Skills Preview */}
                {project.skills_required && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                    <span className="font-medium">Skills:</span>{" "}
                    {(() => {
                      if (Array.isArray(project.skills_required)) {
                        return project.skills_required.join(', ');
                      } else if (typeof project.skills_required === 'string') {
                        try {
                          const parsed = JSON.parse(project.skills_required);
                          return Array.isArray(parsed) ? parsed.join(', ') : project.skills_required;
                        } catch {
                          return project.skills_required;
                        }
                      }
                      return '';
                    })()}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingProject(project)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Details
                  </button>
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                      selectedProjects.includes(project.id)
                        ? "border border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    disabled={
                      selectedProjects.length >= 3 &&
                      !selectedProjects.includes(project.id)
                    }
                  >
                    {selectedProjects.includes(project.id) ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Selected
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Select
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {viewingProject.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingProject.category && (
                      <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                        {viewingProject.category}
                      </span>
                    )}
                    {viewingProject.complexity_level && (
                      <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                        {viewingProject.complexity_level}
                      </span>
                    )}
                    {viewingProject.industry && (
                      <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                        {viewingProject.industry}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingProject(null)}
                  className="flex-shrink-0 rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {/* Description */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">
                    Project Description
                  </h4>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {viewingProject.description}
                </p>
              </section>

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Skills Required */}
                {viewingProject.skills_required && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <h5 className="font-semibold text-slate-800">
                        Required Skills
                      </h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Handle skills_required as JSON array, string, or null
                        let skills = [];
                        if (Array.isArray(viewingProject.skills_required)) {
                          skills = viewingProject.skills_required;
                        } else if (typeof viewingProject.skills_required === 'string') {
                          try {
                            const parsed = JSON.parse(viewingProject.skills_required);
                            skills = Array.isArray(parsed) ? parsed : viewingProject.skills_required.split(',');
                          } catch {
                            skills = viewingProject.skills_required.split(',');
                          }
                        }
                        return skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {typeof skill === 'string' ? skill.trim() : skill}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Team Size */}
                {viewingProject.team_size && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h5 className="font-semibold text-slate-800">Team Size</h5>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {viewingProject.team_size} students
                    </p>
                  </div>
                )}

                {/* Timeline */}
                {(viewingProject.start_date || viewingProject.end_date) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h5 className="font-semibold text-slate-800">Timeline</h5>
                    </div>
                    <p className="text-sm text-slate-600">
                      {viewingProject.start_date && (
                        <span className="block">
                          Start:{" "}
                          {new Date(
                            viewingProject.start_date
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {viewingProject.end_date && (
                        <span className="block">
                          End:{" "}
                          {new Date(viewingProject.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Location */}
                {viewingProject.project_location && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-orange-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <h5 className="font-semibold text-slate-800">Location</h5>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">
                      {viewingProject.project_location}
                    </p>
                  </div>
                )}
              </div>

              {/* Deliverables */}
              {viewingProject.deliverables && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">
                      Expected Deliverables
                    </h4>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {(() => {
                        if (Array.isArray(viewingProject.deliverables)) {
                          return viewingProject.deliverables.join('\n• ');
                        } else if (typeof viewingProject.deliverables === 'string') {
                          try {
                            const parsed = JSON.parse(viewingProject.deliverables);
                            return Array.isArray(parsed) ? '• ' + parsed.join('\n• ') : viewingProject.deliverables;
                          } catch {
                            return viewingProject.deliverables;
                          }
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setViewingProject(null)}
                className="px-6 py-2.5 rounded-lg border-2 border-slate-300 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSelectProject(viewingProject.id);
                  setViewingProject(null);
                }}
                disabled={
                  selectedProjects.includes(viewingProject.id) ||
                  selectedProjects.length >= 3
                }
                className="px-6 py-2.5 rounded-lg bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedProjects.includes(viewingProject.id)
                  ? "Already Selected"
                  : "Select This Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
