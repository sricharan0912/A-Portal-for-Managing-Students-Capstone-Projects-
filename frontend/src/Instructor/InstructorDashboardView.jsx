import React, { useEffect, useState } from "react";
import { getInstructorStats } from "../utils/apiHelper";

/**
 * InstructorDashboardView Component
 * Displays statistics and overview for instructors
 */
export default function InstructorDashboardView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getInstructorStats();
        const { approvedProjects = [], closedProjects = [], pendingProjects = [] } = res.data || {};

        const allProjects = [
          ...approvedProjects.map((p) => ({ ...p, status: "approved" })),
          ...closedProjects.map((p) => ({ ...p, status: "closed" })),
          ...pendingProjects.map((p) => ({ ...p, status: "open" })),
        ];

        setProjects(allProjects);
      } catch (err) {
        console.error("Failed to load instructor stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const projectCount = projects.length;
  const pendingCount = projects.filter(p => p.status === "open").length;
  const approvedCount = projects.filter(p => p.status === "approved").length;
  const closedCount = projects.filter(p => p.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Welcome, Instructor 👩‍🏫</h2>
        <p className="mt-1 text-slate-600">
          Manage client project approvals and assign students to groups
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Projects" count={projectCount} color="blue" />
        <StatCard label="Pending Approval" count={pendingCount} color="yellow" />
        <StatCard label="Approved Projects" count={approvedCount} color="green" />
        <StatCard label="Closed Projects" count={closedCount} color="slate" />
      </div>

      {/* Recent Projects Section */}
      {!loading && projects.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Recent Projects</h3>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="flex items-start justify-between rounded-lg border border-slate-100 p-4 hover:bg-slate-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{project.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-1 mt-1">{project.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {project.category || "Uncategorized"}
                    </span>
                    <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                      project.status === "open"
                        ? "bg-yellow-100 text-yellow-700"
                        : project.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <button className="ml-4 text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap">
                  View
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
            />
          </svg>
          <h4 className="text-lg font-semibold text-slate-700 mb-2">No projects available</h4>
          <p className="text-slate-600 max-w-sm mx-auto">
            Once clients submit projects, you can approve or reject them here.
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, count, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    slate: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md transition">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
          <p className="text-4xl font-bold text-slate-900">{count}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h11M9 21V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
