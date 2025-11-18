import React, { useEffect, useState } from "react";
import { getAutoGroupStats, confirmAutoGroups, rerunAutoGrouping } from "../utils/apiHelper";

/**
 * Instructor → Auto Group Formation Page
 * Shows formation summary, stats, satisfaction chart, and group preview table.
 */
export default function AutoGroupFormationView() {
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAutoGroupStats();
        setStats(res.stats);
        setGroups(res.groups);
      } catch (err) {
        console.error("Error fetching auto-group stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConfirm = async () => {
    try {
      const res = await confirmAutoGroups();
      setMessage(res.success ? "✅ Groups confirmed successfully!" : "⚠️ Failed to confirm groups.");
    } catch {
      setMessage("❌ Something went wrong.");
    }
  };

  const handleRerun = async () => {
    try {
      const res = await rerunAutoGrouping();
      setMessage(res.success ? "🔄 Re-ran grouping algorithm successfully!" : "⚠️ Failed to rerun.");
    } catch {
      setMessage("❌ Something went wrong.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-slate-600">
        Loading auto-group stats...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Auto Group Formation</h2>
        <div className="flex gap-3">
          <button
            onClick={handleRerun}
            className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition"
          >
            Re-run Algorithm
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition"
          >
            Confirm Groups
          </button>
        </div>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.includes("✅") || message.includes("🔄")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Students" value={stats?.students || 0} />
        <StatCard label="Groups Formed" value={stats?.groups || 0} />
        <StatCard
          label="Average Satisfaction"
          value={`${stats?.satisfaction || 0}%`}
          progress={stats?.satisfaction || 0}
        />
        <StatCard label="Projects Assigned" value={stats?.projects || 0} />
      </div>

      {/* Satisfaction Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Overall Satisfaction
        </h3>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 bg-blue-600 transition-all duration-700"
            style={{ width: `${stats?.satisfaction || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {stats?.satisfaction || 0}% of students are satisfied with group allocation.
        </p>
      </div>

      {/* Groups Preview Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Group</th>
              <th className="px-6 py-3 text-left">Members</th>
              <th className="px-6 py-3 text-left">Project</th>
              <th className="px-6 py-3 text-left">Satisfaction</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.length > 0 ? (
              groups.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-3 font-medium text-slate-800">{g.name}</td>
                  <td className="px-6 py-3 text-slate-600">{g.members?.join(", ") || "N/A"}</td>
                  <td className="px-6 py-3 text-slate-600">{g.project || "Unassigned"}</td>
                  <td className="px-6 py-3">
                    <div className="w-24 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 bg-blue-600"
                        style={{ width: `${g.satisfaction || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {g.satisfaction || 0}%
                    </p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                      onClick={() =>
                        (window.location.href = `/instructor-dashboard/groups/${g.id}`)
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
                  No auto-formed groups available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Summary Card Component */
function StatCard({ label, value, progress }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {progress !== undefined && (
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="h-2 bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
