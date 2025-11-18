import React, { useEffect, useState } from "react";
import { getInstructorGroups, autoAssignGroups } from "../utils/apiHelper";

/**
 * Instructor → Groups Page
 * Displays all groups and allows manual or automatic group formation.
 * Matches screenshots and uses existing blue/white theme.
 */
export default function GroupsView() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getInstructorGroups();
        const data = res.data || [];
        setGroups(data);
        setFilteredGroups(data);
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredGroups(
      groups.filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          g.project?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, groups]);

  const handleAutoAssign = async () => {
    setMessage("");
    try {
      const res = await autoAssignGroups();
      if (res.success) {
        setMessage("✅ Groups automatically assigned successfully!");
      } else {
        setMessage("⚠️ Unable to auto-assign groups.");
      }
    } catch (err) {
      console.error("Error auto-assigning groups:", err);
      setMessage("❌ Something went wrong.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-slate-600">
        Loading groups...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Groups</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search groups..."
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

          {/* Form Groups Button */}
          <button
            onClick={() =>
              (window.location.href = "/instructor-dashboard/create-group")
            }
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
            Form Groups
          </button>

          {/* Auto Assign Button */}
          <button
            onClick={handleAutoAssign}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition"
          >
            Auto Assign
          </button>
        </div>
      </div>

      {/* Feedback / Alerts */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Groups Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Group Name</th>
              <th className="px-6 py-3 text-left">Members</th>
              <th className="px-6 py-3 text-left">Project</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <tr
                  key={group.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {group.name}
                  </td>
                  <td className="px-6 py-3">{group.members?.length || 0}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {group.project || "Unassigned"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        group.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {group.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      className="text-blue-700 hover:text-blue-900 font-medium text-sm"
                      onClick={() =>
                        (window.location.href = `/instructor-dashboard/groups/${group.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-6 text-slate-500 text-sm"
                >
                  No groups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
