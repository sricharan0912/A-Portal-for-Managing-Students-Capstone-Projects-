/**
 * ProjectCard Component
 * Displays a single project card with edit and delete actions
 *
 * @param {object} project - Project data object
 * @param {function} onEdit - Callback when edit button is clicked
 * @param {function} onDelete - Callback when delete button is clicked
 */
export default function ProjectCard({ project, onEdit, onDelete }) {
  if (!project) {
    return null;
  }

  // Determine status color based on project status
  const getStatusColor = () => {
    switch (project.status) {
      case "approved":
      case "closed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "open":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
      {/* Header with title and status badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">
          {project.title}
        </h4>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize flex-shrink-0 ${getStatusColor()}`}
        >
          {project.status || "open"}
        </span>
      </div>

      {/* Description */}
      <p className="mb-3 text-xs text-slate-600 line-clamp-2">
        {project.description}
      </p>

      {/* Meta information */}
      {(project.category || project.complexity_level) && (
        <div className="mb-3 flex flex-wrap gap-2">
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
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(project)}
          className="flex items-center gap-1 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
          title="Edit this project"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="hidden sm:inline">Edit</span>
        </button>

        <button
          onClick={() => onDelete(project.id)}
          className="flex items-center gap-1 flex-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 hover:border-red-400"
          title="Delete this project"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}