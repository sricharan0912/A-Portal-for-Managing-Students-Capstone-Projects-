import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Student → Evaluations Page
 * Displays upcoming and past evaluations for student's groups
 * Shows details like location, meeting link, description, etc.
 */
export default function StudentEvaluationsView() {
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
      console.log("Evaluations response:", res);
      setEvaluations(res.data || []);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter((e) => {
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
      day: "numeric",
      year: "numeric",
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
    return Math.ceil((evalDate - today) / (1000 * 60 * 60 * 24));
  };

  const upcomingCount = evaluations.filter((e) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const evalDate = new Date(e.scheduled_date);
    return evalDate >= today && evalDate <= nextWeek && e.status !== "completed" && e.status !== "cancelled";
  }).length;

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
      {filter === "upcoming" && upcomingCount > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-blue-900">
              {evaluations.filter((e) => e.status !== "completed" && e.status !== "cancelled").length} upcoming evaluation{evaluations.filter((e) => e.status !== "completed" && e.status !== "cancelled").length !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-blue-700">{upcomingCount} within the next week</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No {filter === "all" ? "" : filter + " "}Evaluations
          </h3>
          <p className="text-slate-500">
            {filter === "upcoming"
              ? "You don't have any upcoming evaluations scheduled."
              : filter === "past"
              ? "No past evaluations found."
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
                  isToday(evaluation.scheduled_date)
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : isTomorrow(evaluation.scheduled_date)
                    ? "border-yellow-400"
                    : "border-slate-200"
                }`}
              >
                {/* TODAY/TOMORROW Banner */}
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
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${getTypeColor(evaluation.evaluation_type)}`}>
                      {getTypeIcon(evaluation.evaluation_type)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Type Badge and Title */}
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

                      <h3 className="text-lg font-semibold text-slate-800 mb-2">{evaluation.title}</h3>

                      {/* Description */}
                      {evaluation.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{evaluation.description}</p>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-slate-600">
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
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>{evaluation.project_title}</span>
                          </div>
                        )}

                        {/* Location */}
                        {evaluation.location && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{evaluation.location}</span>
                          </div>
                        )}

                        {/* Due Date */}
                        {evaluation.due_date && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Due: {formatDate(evaluation.due_date)}</span>
                          </div>
                        )}

                        {/* Evaluator */}
                        {evaluation.evaluator_name && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Evaluator: {evaluation.evaluator_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {evaluation.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Notes from Instructor</p>
                          <p className="text-sm text-slate-700">{evaluation.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Join Button or Days Left */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
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