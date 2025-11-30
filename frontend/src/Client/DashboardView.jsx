import QuickStats from "../components/ui/QuickStats";

/**
 * DashboardView Component
 * Main dashboard view showing overview, quick stats, and recent projects
 *
 * @param {array} projects - Array of project objects
 * @param {function} onNavigate - Function to navigate to other sections
 */
export default function DashboardView({ projects = [], onNavigate }) {
  // Helper function to get status display info
  const getStatusInfo = (project) => {
    const status = project.approval_status || "pending";
    switch (status) {
      case "approved":
        return { label: "Approved", bgColor: "bg-green-100", textColor: "text-green-700" };
      case "rejected":
        return { label: "Rejected", bgColor: "bg-red-100", textColor: "text-red-700" };
      case "pending":
      default:
        return { label: "Pending", bgColor: "bg-yellow-100", textColor: "text-yellow-700" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="mt-1 text-slate-600">
          Manage your projects and connect with students
        </p>
      </div>

      {/* Quick Stats Cards */}
      <QuickStats projects={projects} />

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onNavigate("projects")}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <svg
            className="h-5 w-5"
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
          Create New Project
        </button>
        <button
          onClick={() => onNavigate("projects")}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          View All Projects
        </button>
      </div>

      {/* Recent Projects Section */}
      {projects.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Recent Projects
          </h3>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => {
              const statusInfo = getStatusInfo(project);
              return (
                <div
                  key={project.id}
                  className="flex items-start justify-between rounded-lg border border-slate-100 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">
                      {project.title}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                      {project.description}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {project.category || "Uncategorized"}
                      </span>
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate("projects")}
                    className="ml-4 text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
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
            No projects created yet
          </h4>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Create your first project to post opportunities for students and
            start building relationships
          </p>
          <button
            onClick={() => onNavigate("projects")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Project
          </button>
        </section>
      )}
    </div>
  );
}