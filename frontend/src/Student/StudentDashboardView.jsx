/**
 * StudentDashboardView Component
 * Main dashboard view showing overview, quick stats, and getting started guide
 *
 * @param {array} projects - Array of available project objects
 * @param {array} preferences - Array of submitted preferences
 * @param {object} assignedGroup - Assigned group data or null
 * @param {function} onNavigate - Function to navigate to other sections
 */
export default function StudentDashboardView({
  projects = [],
  preferences = [],
  assignedGroup = null,
  onNavigate,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Welcome back! 👋</h2>
        <p className="mt-1 text-slate-600">
          Here's your capstone project overview
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Available Projects Card */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Available Projects
              </p>
              <p className="text-4xl font-bold text-slate-900">{projects.length}</p>
            </div>
            <div className="rounded-lg bg-slate-200/50 p-3">
              <svg
                className="h-6 w-6 text-slate-700"
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
            </div>
          </div>
        </div>

        {/* Preferences Submitted Card */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Preferences Submitted
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {preferences.length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-200/50 p-3">
              <svg
                className="h-6 w-6 text-slate-700"
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
          </div>
        </div>

        {/* Group Status Card */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Group Status
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {assignedGroup && !assignedGroup.message ? "Assigned" : "Pending"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-200/50 p-3">
              <svg
                className="h-6 w-6 text-slate-700"
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
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started + Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Getting Started Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Getting Started
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                1
              </div>
              <div>
                <p className="font-medium text-slate-800">Browse Projects</p>
                <p className="text-sm text-slate-600">
                  Review available capstone projects from industry partners
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                2
              </div>
              <div>
                <p className="font-medium text-slate-800">Select Preferences</p>
                <p className="text-sm text-slate-600">
                  Choose your top 3 project preferences in ranked order
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                3
              </div>
              <div>
                <p className="font-medium text-slate-800">Wait for Assignment</p>
                <p className="text-sm text-slate-600">
                  Your instructor will assign you to a project team
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => onNavigate("browse")}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
              Browse Projects
            </button>
            <button
              onClick={() => onNavigate("preferences")}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              My Preferences
            </button>
          </div>
        </section>

        {/* Recent Activity Section */}
        {preferences.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {preferences.slice(0, 3).map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-4 w-4 text-green-600"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      Preference #{pref.preference_rank} submitted
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {pref.title || "Project"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Group Assigned Section (if assigned) */}
        {assignedGroup && !assignedGroup.message && (
          <section className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
            <div className="mb-4 flex items-center gap-2">
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
                Group Assigned!
              </h3>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Project:</span>{" "}
                  {assignedGroup.title || "TBA"}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Group Number:</span>{" "}
                  {assignedGroup.group_number || "TBA"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("group")}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              View Group Details
            </button>
          </section>
        )}
      </div>

      {/* Quick Links */}
      {projects.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={() => onNavigate("browse")}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
            >
              <span>Browse All Projects ({projects.length})</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => onNavigate("preferences")}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
            >
              <span>View Your Preferences ({preferences.length})</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}