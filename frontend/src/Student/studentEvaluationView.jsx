import React, { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Student → Evaluations Page
 * Displays upcoming and past evaluations for student's groups
 */
export default function StudentEvaluationsView() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming"); // upcoming, past, all

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
      case "sprint": return "bg-blue-100 text-blue-700 border-blue-200";
      case "milestone": return "bg-purple-100 text-purple-700 border-purple-200";
      case "final": return "bg-red-100 text-red-700 border-red-200";
      case "weekly": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
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
      day: "numeric",
      year: "numeric"
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

  const isToday = (date) => {
    const today = new Date();
    const evalDate = new Date(date);
    return today.toDateString() === evalDate.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const evalDate = new Date(date);
    return tomorrow.toDateString() === evalDate.toDateString();
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const evalDate = new Date(date);
    evalDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((evalDate - today) / (1000 * 60 * 60 * 24));
    return diff;
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
          <h2 className="text-2xl font-bold text-slate-800">My Evaluations</h2>
          <p className="text-slate-500 text-sm mt-1">
            Sprints, milestones, and weekly updates for your projects
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

      {/* Upcoming Alert */}
      {filter === "upcoming" && filteredEvaluations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-blue-800">
                {filteredEvaluations.length} upcoming evaluation{filteredEvaluations.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-blue-600">
                {filteredEvaluations.filter(e => getDaysUntil(e.scheduled_date) <= 7).length} within the next week
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Evaluations List */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {filter === "upcoming" ? "No Upcoming Evaluations" : 
             filter === "past" ? "No Past Evaluations" : "No Evaluations"}
          </h3>
          <p className="text-slate-500">
            {filter === "upcoming" 
              ? "You don't have any upcoming evaluations scheduled."
              : "No evaluations to display."}
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
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  isToday(evaluation.scheduled_date) ? "border-blue-400 ring-2 ring-blue-100" :
                  isTomorrow(evaluation.scheduled_date) ? "border-yellow-400" :
                  "border-slate-200"
                }`}
              >
                {/* Date Badge for Today/Tomorrow */}
                {isToday(evaluation.scheduled_date) && (
                  <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 text-center">
                    📅 TODAY
                  </div>
                )}
                {isTomorrow(evaluation.scheduled_date) && (
                  <div className="bg-yellow-500 text-white text-xs font-semibold px-4 py-1.5 text-center">
                    ⏰ TOMORROW
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${getTypeColor(evaluation.evaluation_type)}`}>
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
                            Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        {evaluation.title}
                      </h3>

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

                        {/* Project */}
                        {evaluation.project_title && (
                          <div className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>{evaluation.project_title}</span>
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

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {evaluation.meeting_link && isUpcoming && (
                        <a
                          href={evaluation.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Meeting
                        </a>
                      )}
                      {isUpcoming && daysUntil > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-700">{daysUntil}</div>
                          <div className="text-xs text-slate-500">days left</div>
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
    </div>
  );
}