import React, { useEffect, useState } from "react";
import { getInstructorEvaluations } from "../utils/apiHelper";

/**
 * Instructor → Evaluations Page
 * Displays scheduled and completed evaluations with search and schedule button.
 * Matches your screenshots and current blue theme.
 */
export default function EvaluationsView() {
  const [evaluations, setEvaluations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getInstructorEvaluations();
        const data = res.data || [];
        setEvaluations(data);
        setFiltered(data);
      } catch (err) {
        console.error("Error fetching evaluations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      evaluations.filter(
        (e) =>
          e.project.toLowerCase().includes(term) ||
          e.group.toLowerCase().includes(term) ||
          e.evaluator.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, evaluations]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-slate-600">
        Loading evaluations...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Evaluations</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search evaluations..."
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

          {/* Schedule Evaluation Button */}
          <button
            onClick={() =>
              (window.location.href = "/instructor-dashboard/schedule-evaluation")
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
            Schedule Evaluation
          </button>
        </div>
      </div>

      {/* Evaluation Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Project / Group</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Evaluator</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {e.project} ({e.group})
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(e.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{e.evaluator}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        e.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : e.status === "Scheduled"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                      onClick={() =>
                        (window.location.href = `/instructor-dashboard/evaluations/${e.id}`)
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
                  No evaluations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
