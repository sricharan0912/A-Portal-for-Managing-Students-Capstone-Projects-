/**
 * GroupView Component
 * Displays assigned project group information for the student
 * Shows project details, group number, and team assignment status
 *
 * @param {object} assignedGroup - Group assignment data or null/message
 * @param {boolean} loading - Loading state
 */
export default function GroupView({ assignedGroup = null, loading = false }) {
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
          <p className="text-slate-500">Loading group information...</p>
        </div>
      </div>
    );
  }

  // Not assigned yet
  if (!assignedGroup || assignedGroup.message) {
    return (
      <div className="space-y-6">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-slate-800">My Group</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Your assigned project team information
          </p>
        </div>

        {/* Pending Assignment */}
        <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-yellow-400 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-yellow-900 mb-2">
            Group Assignment Pending
          </h3>
          <p className="text-yellow-800 mb-4 max-w-sm mx-auto">
            Your group is still being finalized. Your instructor will assign you
            to a team once all preferences are reviewed.
          </p>
          <div className="inline-block bg-white rounded-lg px-4 py-2 text-sm text-yellow-800">
            Check back soon!
          </div>
        </div>

        {/* What to do next */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">What to do next?</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                1
              </div>
              <div>
                <p className="font-medium text-slate-800">Submit Preferences</p>
                <p className="text-sm text-slate-600">
                  If you haven't already, rank your top 3 project preferences
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                2
              </div>
              <div>
                <p className="font-medium text-slate-800">Wait for Assignment</p>
                <p className="text-sm text-slate-600">
                  Your instructor will review all preferences and create balanced
                  teams
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                3
              </div>
              <div>
                <p className="font-medium text-slate-800">Check Email</p>
                <p className="text-sm text-slate-600">
                  You'll receive an email notification when your group is assigned
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Assigned
  return (
    <div className="space-y-6">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800">My Group</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Your assigned project team information
        </p>
      </div>

      {/* Success Banner */}
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900">
            Group Assigned!
          </h3>
        </div>
        <p className="text-green-800">
          Congratulations! You have been assigned to your project team. Here are
          the details below.
        </p>
      </div>

      {/* Group Information Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Project Details */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="text-base font-semibold text-slate-800">
              Project Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Project Title</p>
              <p className="text-lg font-semibold text-slate-900">
                {assignedGroup.title || "TBA"}
              </p>
            </div>

            {assignedGroup.description && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Description</p>
                <p className="text-sm text-slate-700 line-clamp-3">
                  {assignedGroup.description}
                </p>
              </div>
            )}

            {assignedGroup.category && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Category</p>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {assignedGroup.category}
                </span>
              </div>
            )}

            {assignedGroup.skills_required && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {assignedGroup.skills_required.split(",").map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Group Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
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
            <h3 className="text-base font-semibold text-slate-800">
              Group Information
            </h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-xs text-slate-600 mb-1">Group Number</p>
              <p className="text-3xl font-bold text-purple-600">
                {assignedGroup.group_number || "TBA"}
              </p>
            </div>

            {assignedGroup.team_size && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Team Size</p>
                <p className="text-lg font-semibold text-slate-900">
                  {assignedGroup.team_size} students
                </p>
              </div>
            )}

            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2">
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
                <p className="text-sm font-medium text-green-800">
                  Status: Active
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Project Details Extended */}
      {(assignedGroup.start_date ||
        assignedGroup.end_date ||
        assignedGroup.deliverables ||
        assignedGroup.project_location) && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">
            Project Specifications
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assignedGroup.start_date && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Start Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(assignedGroup.start_date).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            )}

            {assignedGroup.end_date && (
              <div>
                <p className="text-xs text-slate-600 mb-1">End Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(assignedGroup.end_date).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            )}

            {assignedGroup.project_location && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Work Location</p>
                <p className="text-sm font-medium text-slate-900">
                  {assignedGroup.project_location}
                </p>
              </div>
            )}

            {assignedGroup.complexity_level && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Complexity Level</p>
                <p className="text-sm font-medium text-slate-900">
                  {assignedGroup.complexity_level}
                </p>
              </div>
            )}
          </div>

          {assignedGroup.deliverables && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2">Expected Deliverables</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {assignedGroup.deliverables}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Next Steps */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0"
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
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Contact your group members and introduce yourself</li>
              <li>• Schedule your first team meeting</li>
              <li>• Review the project requirements and deliverables</li>
              <li>• Create a project plan with your team</li>
              <li>• Start working towards the project goals</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}