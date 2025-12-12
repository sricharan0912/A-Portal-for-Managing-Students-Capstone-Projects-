import React, { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Student → Evaluations Page
 * Displays scheduled and completed evaluations for the student's group.
 */
export default function StudentEvaluationsView({ studentId }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch evaluations for this student's group
        const res = await apiCall(`/students/${studentId}/evaluations`, {
          method: "GET",
        });
        
        setEvaluations(res.data || res.evaluations || []);
      } catch (err) {
        console.error("Error fetching evaluations:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluations();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading evaluations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Evaluations</h2>
          <p className="text-slate-500 text-sm mt-1">
            View your scheduled and completed project evaluations
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Unable to load evaluations</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Evaluations List */}
      {evaluations.length > 0 ? (
        <div className="grid gap-4">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      evaluation.evaluation_type === "sprint" 
                        ? "bg-blue-100 text-blue-700"
                        : evaluation.evaluation_type === "milestone"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {evaluation.evaluation_type || "Evaluation"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {evaluation.title || evaluation.project_title || "Project Evaluation"}
                  </h3>
                  {evaluation.description && (
                    <p className="text-slate-500 text-sm mt-1">{evaluation.description}</p>
                  )}
                  <p className="text-slate-400 text-xs mt-1">
                    {evaluation.project_title && `Project: ${evaluation.project_title}`}
                    {evaluation.group_name && ` • Group ${evaluation.group_name}`}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      evaluation.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : evaluation.status === "scheduled"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {evaluation.status || "Scheduled"}
                  </span>
                  <span className="text-slate-600 text-sm font-medium">
                    {evaluation.scheduled_date
                      ? new Date(evaluation.scheduled_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date TBD"}
                  </span>
                  {evaluation.scheduled_time && (
                    <span className="text-slate-500 text-sm">
                      at {evaluation.scheduled_time}
                    </span>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {evaluation.location && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location: <strong>{evaluation.location}</strong></span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No Evaluations Yet
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Your project evaluations will appear here once they are scheduled by your instructor.
          </p>
        </div>
      )}
    </div>
  );
}