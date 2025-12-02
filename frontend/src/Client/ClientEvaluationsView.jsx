import React, { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Client → Evaluations Page
 * Displays upcoming and past evaluations for client's projects
 */
export default function ClientEvaluationsView() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await apiCall("/evaluations", { method: "GET" });
      setEvaluations(res.data || []);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter evaluations
  const filteredEvaluations = evaluations.filter(e => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const evalDate = new Date(e.scheduled_date);
    
    if (filter === "upcoming") {
      return evalDate >= today && e.status !== "completed" && e.status !== "cancelled";
    }
    if (filter === "past") {
      return evalDate < today || e.status === "completed";
    }
    return true;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case "sprint": return "bg-blue-100 text-blue-700";
      case "milestone": return "bg-purple-100 text-purple-700";
      case "final": return "bg-red-100 text-red-700";
      case "weekly": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "sprint": return "🏃";
      case "milestone": return "🎯";
      case "final": return "🎓";
      case "weekly": return "📅";
      default: return "📋";
    }
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const evalDate = new Date(date);
    evalDate.setHours(0, 0, 0, 0);
    return Math.ceil((evalDate - today) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Project Evaluations</h2>
          <p className="text-slate-500 text-sm mt-1">
            Track sprints, milestones, and progress updates for your projects
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          {["upcoming", "past", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                filter === f
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{evaluations.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {evaluations.filter(e => e.status === "scheduled").length}
          </div>
          <div className="text-xs text-yellow-600">Scheduled</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {evaluations.filter(e => e.evaluation_type === "milestone").length}
          </div>
          <div className="text-xs text-blue-600">Milestones</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {evaluations.filter(e => e.status === "completed").length}
          </div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
      </div>

      {/* Evaluations List */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No {filter === "all" ? "" : filter} Evaluations
          </h3>
          <p className="text-slate-500">
            No evaluations to display for your projects.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => {
            const daysUntil = getDaysUntil(evaluation.scheduled_date);
            const isUpcoming = daysUntil >= 0 && evaluation.status !== "completed";

            return (
              <div
                key={evaluation.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getTypeColor(evaluation.evaluation_type)}`}>
                      {getTypeIcon(evaluation.evaluation_type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(evaluation.evaluation_type)}`}>
                          {evaluation.evaluation_type?.charAt(0).toUpperCase() + evaluation.evaluation_type?.slice(1)}
                        </span>
                        {evaluation.status === "completed" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            ✓ Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-800">
                        {evaluation.title}
                      </h3>

                      {evaluation.project_title && (
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          {evaluation.project_title}
                        </p>
                      )}

                      {evaluation.description && (
                        <p className="text-sm text-slate-500 mb-3">
                          {evaluation.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        {/* Date & Time */}
                        <div className="flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(evaluation.scheduled_date)}</span>
                          {evaluation.scheduled_time && (
                            <span className="text-slate-400">at {formatTime(evaluation.scheduled_time)}</span>
                          )}
                        </div>

                        {/* Group */}
                        {evaluation.group_name && (
                          <div className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{evaluation.group_name}</span>
                          </div>
                        )}

                        {/* Location */}
                        {evaluation.location && (
                          <div className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span>{evaluation.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Days left / Join */}
                    <div className="flex-shrink-0 text-right">
                      {evaluation.meeting_link && isUpcoming && (
                        <a
                          href={evaluation.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition mb-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join
                        </a>
                      )}
                      {isUpcoming && daysUntil >= 0 && (
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            daysUntil === 0 ? "text-blue-600" :
                            daysUntil <= 3 ? "text-yellow-600" :
                            "text-slate-600"
                          }`}>
                            {daysUntil === 0 ? "Today" : daysUntil}
                          </div>
                          {daysUntil > 0 && (
                            <div className="text-xs text-slate-500">days left</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">About Evaluations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="text-xl">🏃</span>
            <div>
              <p className="font-medium text-slate-700">Sprint Reviews</p>
              <p className="text-xs text-slate-500">Regular check-ins on progress</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <p className="font-medium text-slate-700">Milestones</p>
              <p className="text-xs text-slate-500">Major project deliverables</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-medium text-slate-700">Weekly Updates</p>
              <p className="text-xs text-slate-500">Regular status meetings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🎓</span>
            <div>
              <p className="font-medium text-slate-700">Final Presentation</p>
              <p className="text-xs text-slate-500">End of project demonstration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}