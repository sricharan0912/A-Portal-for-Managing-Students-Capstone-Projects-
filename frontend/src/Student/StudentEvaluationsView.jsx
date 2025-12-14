import React, { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Student → Evaluations Page
 * Displays scheduled and completed evaluations for the student's group.
 * Includes search and filter functionality similar to instructor view.
 */
export default function StudentEvaluationsView({ studentId }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
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

  // Filter evaluations
  const filteredEvaluations = evaluations.filter((e) => {
    // Status filter
    if (statusFilter === "scheduled" && e.status !== "scheduled") return false;
    if (statusFilter === "in_progress" && e.status !== "in_progress") return false;
    if (statusFilter === "completed" && e.status !== "completed") return false;
    
    // Type filter
    if (typeFilter !== "all" && e.evaluation_type !== typeFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.project_title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  // Get color classes for evaluation type
  const getTypeColor = (type) => {
    switch (type) {
      case "sprint":
        return "bg-blue-100 text-blue-700";
      case "milestone":
        return "bg-purple-100 text-purple-700";
      case "weekly":
        return "bg-teal-100 text-teal-700";
      case "final":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Get color classes for status
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Evaluations</h2>
        <p className="text-slate-500 text-sm mt-1">
          View your scheduled and completed project evaluations
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Unable to load evaluations</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search evaluations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="sprint">Sprint</option>
          <option value="milestone">Milestone</option>
          <option value="weekly">Weekly</option>
          <option value="final">Final</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{evaluations.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {evaluations.filter((e) => e.status === "scheduled").length}
          </div>
          <div className="text-xs text-yellow-600">Scheduled</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {evaluations.filter((e) => e.status === "in_progress").length}
          </div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {evaluations.filter((e) => e.status === "completed").length}
          </div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
      </div>

      {/* Evaluations List */}
      {filteredEvaluations.length > 0 ? (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          evaluation.evaluation_type
                        )}`}
                      >
                        {evaluation.evaluation_type?.charAt(0).toUpperCase() +
                          evaluation.evaluation_type?.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          evaluation.status
                        )}`}
                      >
                        {evaluation.status
                          ?.replace("_", " ")
                          .split(" ")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {evaluation.title || "Project Evaluation"}
                    </h3>

                    {evaluation.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                        {evaluation.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      {/* Date & Time */}
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(evaluation.scheduled_date)}</span>
                        {evaluation.scheduled_time && (
                          <span className="text-slate-400">
                            at {formatTime(evaluation.scheduled_time)}
                          </span>
                        )}
                      </div>

                      {/* Project */}
                      {evaluation.project_title && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          <span>{evaluation.project_title}</span>
                        </div>
                      )}

                      {/* Group */}
                      {evaluation.group_name && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>Group {evaluation.group_name}</span>
                        </div>
                      )}

                      {/* Location */}
                      {evaluation.location && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{evaluation.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Meeting Link (if available) */}
                  <div className="flex items-center gap-2">
                    {evaluation.meeting_link && (
                      <a
                        href={evaluation.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "No Matching Evaluations"
              : "No Evaluations Yet"}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Your project evaluations will appear here once they are scheduled by your instructor."}
          </p>
        </div>
      )}
    </div>
  );
}