import { useState, useEffect } from "react";

/**
 * PreferencesView Component
 * Allows students to select and submit project preferences
 * Shows submitted preferences with ranking
 * Includes deadline display and confirmation dialog for updates
 *
 * @param {array} projects - Array of available project objects
 * @param {array} preferences - Array of submitted preferences
 * @param {function} onSelectProject - Callback when project is selected/deselected
 * @param {function} onSubmitPreferences - Callback to submit preferences
 * @param {array} selectedProjects - Array of selected project IDs
 * @param {boolean} loading - Loading state
 * @param {string} deadline - ISO date string for submission deadline
 * @param {string} lastUpdated - ISO date string for last preference update
 */
export default function PreferencesView({
  projects = [],
  preferences = [],
  selectedProjects = [],
  onSelectProject,
  onSubmitPreferences,
  loading,
  deadline,
  lastUpdated,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  // Check if deadline has passed
  useEffect(() => {
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      setIsDeadlinePassed(now > deadlineDate);
    } else {
      setIsDeadlinePassed(false);
    }
  }, [deadline]);

  const handleSelectProject = (projectId) => {
    if (isDeadlinePassed) return;
    onSelectProject(projectId);
  };

  // Called when user clicks submit button
  const handleSubmitClick = () => {
    if (selectedProjects.length === 0) {
      alert("Please select at least 1 project");
      return;
    }

    // If user already has preferences, show confirmation dialog
    if (preferences.length > 0) {
      setShowConfirmDialog(true);
    } else {
      // First time submitting, just submit directly
      handleConfirmedSubmit();
    }
  };

  // Called after user confirms (or if first-time submission)
  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);
    try {
      await onSubmitPreferences(selectedProjects);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSelection = () => {
    selectedProjects.forEach((id) => onSelectProject(id));
  };

  // Get project details for selected projects
  const getProjectTitle = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title || "Project";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get deadline status text and styling
  const getDeadlineInfo = () => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) {
      return {
        text: "Deadline has passed",
        urgent: true,
        passed: true,
      };
    } else if (diffDays <= 1) {
      return {
        text: `${diffHours} hours remaining`,
        urgent: true,
        passed: false,
      };
    } else if (diffDays <= 3) {
      return {
        text: `${diffDays} days remaining`,
        urgent: true,
        passed: false,
      };
    } else {
      return {
        text: `Due ${formatDate(deadline)}`,
        urgent: false,
        passed: false,
      };
    }
  };

  const deadlineInfo = getDeadlineInfo();

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Update Preferences?
              </h3>
            </div>
            <p className="text-slate-600 mb-6">
              You already have {preferences.length} preference{preferences.length > 1 ? "s" : ""} submitted. 
              Submitting new preferences will replace your existing selections.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 rounded-lg border-2 border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800">My Preferences</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Select and rank your top 3 project preferences
        </p>
      </div>

      {/* Deadline Banner */}
      {deadlineInfo && (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${
            deadlineInfo.passed
              ? "bg-red-50 border-red-200"
              : deadlineInfo.urgent
              ? "bg-yellow-50 border-yellow-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              deadlineInfo.passed
                ? "text-red-600"
                : deadlineInfo.urgent
                ? "text-yellow-600"
                : "text-blue-600"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p
              className={`font-medium ${
                deadlineInfo.passed
                  ? "text-red-800"
                  : deadlineInfo.urgent
                  ? "text-yellow-800"
                  : "text-blue-800"
              }`}
            >
              {deadlineInfo.text}
            </p>
            {deadlineInfo.passed && (
              <p className="text-sm text-red-600 mt-1">
                You can no longer submit or modify preferences.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Selection Interface */}
        <div className={`space-y-4 ${isDeadlinePassed ? "opacity-60" : ""}`}>
          <h3 className="text-lg font-semibold text-slate-800">
            Select Projects
          </h3>

          {/* Selection Counter */}
          {selectedProjects.length > 0 && !isDeadlinePassed && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800 mb-2">
                <span className="font-semibold">{selectedProjects.length}</span>{" "}
                of <span className="font-semibold">3</span> preferences selected
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(selectedProjects.length / 3) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Available Projects */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 font-semibold text-slate-800">
              Available Projects ({projects.length})
            </h4>

            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects available</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                      isDeadlinePassed
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      selectedProjects.includes(project.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectProject(project.id)}
                      disabled={
                        isDeadlinePassed ||
                        (selectedProjects.length >= 3 &&
                          !selectedProjects.includes(project.id))
                      }
                      className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition ${
                        selectedProjects.includes(project.id)
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {selectedProjects.includes(project.id) && (
                        <svg
                          className="h-3 w-3 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {project.title}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {project.category || "Uncategorized"}
                      </p>
                    </div>

                    {/* Rank Badge */}
                    {selectedProjects.includes(project.id) && (
                      <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                        {selectedProjects.indexOf(project.id) + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview and Submission */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Your Selection
          </h3>

          {selectedProjects.length === 0 || isDeadlinePassed ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400 mb-3"
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
              <p className="text-sm text-slate-600">
                {isDeadlinePassed
                  ? "Deadline has passed"
                  : "No projects selected yet"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isDeadlinePassed
                  ? "You can no longer modify preferences"
                  : "Select up to 3 projects from the list on the left"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="space-y-3">
                {selectedProjects.map((projectId, index) => (
                  <div
                    key={projectId}
                    className="flex items-start gap-3 rounded-lg bg-white border border-blue-100 p-4"
                  >
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800">
                        {getProjectTitle(projectId)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Preference #{index + 1}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectProject(projectId)}
                      className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-red-600 transition"
                      title="Remove from selection"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="w-full mt-4 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Submitting..."
                  : preferences.length > 0
                  ? "Update Preferences"
                  : "Submit Preferences"}
              </button>
            </div>
          )}

          {/* Clear Selection Button */}
          {selectedProjects.length > 0 && !isDeadlinePassed && (
            <button
              onClick={handleClearSelection}
              className="w-full rounded-lg border-2 border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Submitted Preferences */}
      {preferences.length > 0 && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-green-600"
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
              <h3 className="text-lg font-semibold text-green-800">
                Submitted Preferences
              </h3>
            </div>
            {lastUpdated && (
              <span className="text-xs text-green-600">
                Last updated: {formatDate(lastUpdated)}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {preferences.map((pref) => (
              <div
                key={pref.id || pref.project_id}
                className="flex items-center gap-3 rounded-lg bg-white border border-green-200 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
                  {pref.preference_rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{pref.title}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {pref.category || "Uncategorized"} •{" "}
                    {pref.complexity_level || "Not specified"}
                  </p>
                </div>
                <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  ✓ Submitted
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-green-700 bg-white rounded-lg p-3">
            Your preferences have been submitted successfully. Your instructor
            will use these to assign you to a project group.
            {!isDeadlinePassed && " You can update your preferences until the deadline."}
          </p>
        </section>
      )}
    </div>
  );
}