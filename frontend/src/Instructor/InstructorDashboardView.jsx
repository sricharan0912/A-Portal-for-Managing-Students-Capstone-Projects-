import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getInstructorStats } from "../utils/apiHelper";

/**
 * InstructorDashboardView Component
 */
export default function InstructorDashboardView({ instructorId }) {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeProjects: 0,
    pendingEvaluations: 0,
    totalGroups: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [upcomingEvaluations, setUpcomingEvaluations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refresh stats when navigating back to dashboard or when instructorId changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!instructorId) {
        console.error("No instructor ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getInstructorStats(instructorId);
        const data = res.data || {};

        // Map backend response structure to frontend expectations
        setStats({
          totalStudents: data.students?.total_students || 0,
          activeProjects: data.projects?.approved_projects || 0,
          pendingEvaluations: data.projects?.pending_projects || 0,
          totalGroups: data.groups?.total_groups || 0,
        });

        // These would need separate API endpoints or backend enhancement
        setRecentStudents(data.recentStudents || []);
        setUpcomingEvaluations(data.upcomingEvaluations || []);
        setAnnouncements(data.announcements || []);
      } catch (err) {
        console.error("Failed to load instructor stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [instructorId, location.pathname]); // Re-fetch when path changes (navigating back)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-xl p-6 shadow-md">
        <h2 className="text-3xl font-bold">Welcome back, Instructor!</h2>
        <p className="mt-2 text-blue-100 text-sm">
          Manage students, review projects, and monitor ongoing evaluations all in one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" count={stats.totalStudents} color="blue" />
        <StatCard label="Active Projects" count={stats.activeProjects} color="green" />
        <StatCard label="Pending Approval" count={stats.pendingEvaluations} color="yellow" />
        <StatCard label="Total Groups" count={stats.totalGroups} color="indigo" />
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Students */}
        <section className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Recent Students</h3>
          {recentStudents.length > 0 ? (
            <ul className="space-y-3">
              {recentStudents.slice(0, 5).map((student) => (
                <li
                  key={student.id}
                  className="flex items-center justify-between border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                      {student.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No recent students.</p>
          )}
        </section>

        {/* Upcoming Evaluations */}
        <section className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Upcoming Evaluations
          </h3>
          {upcomingEvaluations.length > 0 ? (
            <ul className="space-y-3">
              {upcomingEvaluations.slice(0, 4).map((evalItem) => (
                <li
                  key={evalItem.id}
                  className="flex justify-between items-start border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {evalItem.teamName || "Team"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(evalItem.date).toLocaleDateString()} at{" "}
                      {evalItem.time || "TBD"}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {evalItem.status || "Scheduled"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No upcoming evaluations.</p>
          )}
        </section>

        {/* Announcements */}
        <section className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Announcements
          </h3>
          {announcements.length > 0 ? (
            <ul className="space-y-3">
              {announcements.slice(0, 4).map((note, index) => (
                <li
                  key={index}
                  className="border border-slate-100 rounded-lg p-3 bg-blue-50/40"
                >
                  <p className="text-sm font-medium text-slate-800">{note.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{note.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No new announcements.</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** Quick Stats Card */
function StatCard({ label, count, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h11M9 21V3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}