import { useEffect } from "react";

/**
 * GroupView Component
 * Displays assigned project group information for the student
 */
export default function GroupView({ assignedGroup = null, groupMembers = [], loading = false }) {
  // Debug logging
  useEffect(() => {
    console.log("GroupView received:", { assignedGroup, groupMembers, loading });
  }, [assignedGroup, groupMembers, loading]);

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
  if (!assignedGroup) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-800">My Group</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Your assigned project team information</p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-yellow-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-yellow-900 mb-2">Group Assignment Pending</h3>
          <p className="text-yellow-800 mb-4 max-w-sm mx-auto">
            Your group is still being finalized. Your instructor will assign you to a team once all preferences are reviewed.
          </p>
          <div className="inline-block bg-white rounded-lg px-4 py-2 text-sm text-yellow-800">
            Check back soon!
          </div>
        </div>
      </div>
    );
  }

  // Assigned - show full group info
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800">My Group</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Your assigned project team information</p>
      </div>

      {/* Success Banner */}
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900">Group Assigned!</h3>
        </div>
        <p className="text-green-800">
          Congratulations! You have been assigned to your project team.
        </p>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Project Details */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-base font-semibold text-slate-800">Project Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Project Title</p>
              <p className="text-lg font-semibold text-slate-900">
                {assignedGroup.title || "Not specified"}
              </p>
            </div>

            {assignedGroup.description && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700 line-clamp-4">{assignedGroup.description}</p>
              </div>
            )}

            {assignedGroup.category && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {assignedGroup.category}
                </span>
              </div>
            )}

            {assignedGroup.skills_required && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {String(assignedGroup.skills_required).split(",").map((skill, idx) => (
                    <span key={idx} className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
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
            <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-base font-semibold text-slate-800">Group Information</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-xs text-slate-500 mb-1">Group Number</p>
              <p className="text-3xl font-bold text-purple-600">
                {assignedGroup.group_number || assignedGroup.id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Team Size</p>
              <p className="text-lg font-semibold text-slate-900">
                {groupMembers.length || assignedGroup.team_size || "—"} member{(groupMembers.length || assignedGroup.team_size || 0) !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">Status: Active</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Team Members Section */}
      {groupMembers && groupMembers.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-base font-semibold text-slate-800">
              Team Members ({groupMembers.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groupMembers.map((member, index) => (
              <div
                key={member.id || index}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                  {(member.first_name?.[0] || "").toUpperCase()}{(member.last_name?.[0] || "").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {member.full_name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unknown"}
                  </p>
                  {member.email && (
                    <p className="text-sm text-slate-500 truncate">{member.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Steps */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Contact your group members and introduce yourself</li>
              <li>• Schedule your first team meeting</li>
              <li>• Review the project requirements and deliverables</li>
              <li>• Create a project plan with your team</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}