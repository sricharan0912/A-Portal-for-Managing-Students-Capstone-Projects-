import React, { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Instructor → Evaluations Page
 * Displays scheduled evaluations (sprints, milestones, weekly updates)
 */
export default function EvaluationsView() {
  const [evaluations, setEvaluations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // View state - 'list' or 'create'
  const [view, setView] = useState("list");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    evaluation_type: "sprint",
    group_id: "",
    project_id: "",
    scheduled_date: "",
    scheduled_time: "",
    due_date: "",
    location: "",
    meeting_link: "",
    evaluator_name: "",
    notes: "",
  });

  useEffect(() => {
    fetchEvaluations();
    fetchGroups();
    fetchProjects();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await apiCall("/evaluations", { method: "GET" });
      setEvaluations(res.data || []);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
      setMessage({ type: "error", text: "Failed to load evaluations" });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await apiCall("/instructors/groups", { method: "GET" });
      setGroups(res.data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiCall("/projects", { method: "GET" });
      setProjects((res.data || []).filter(p => p.approval_status === "approved"));
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-fill project when group is selected
    if (name === "group_id" && value) {
      const selectedGroup = groups.find(g => g.id === parseInt(value));
      if (selectedGroup?.project_id) {
        setFormData(prev => ({ ...prev, project_id: selectedGroup.project_id.toString() }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        ...formData,
        group_id: formData.group_id ? parseInt(formData.group_id) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
      };

      const res = await apiCall("/evaluations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage({ type: "success", text: "Evaluation scheduled successfully!" });
        setView("list");
        resetForm();
        fetchEvaluations();
      } else {
        setFormError(res.error || "Failed to schedule evaluation");
      }
    } catch (err) {
      console.error("Error scheduling evaluation:", err);
      setFormError(err.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      evaluation_type: "sprint",
      group_id: "",
      project_id: "",
      scheduled_date: "",
      scheduled_time: "",
      due_date: "",
      location: "",
      meeting_link: "",
      evaluator_name: "",
      notes: "",
    });
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this evaluation?")) {
      return;
    }

    try {
      await apiCall(`/evaluations/${id}`, { method: "DELETE" });
      setEvaluations(evaluations.filter(e => e.id !== id));
      setMessage({ type: "success", text: "Evaluation deleted successfully" });
    } catch (err) {
      console.error("Error deleting evaluation:", err);
      setMessage({ type: "error", text: "Failed to delete evaluation" });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiCall(`/evaluations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      setEvaluations(evaluations.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));
      setMessage({ type: "success", text: "Status updated successfully" });
    } catch (err) {
      console.error("Error updating status:", err);
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  // Filter evaluations
  const filteredEvaluations = evaluations.filter(e => {
    // Status filter
    if (filter === "upcoming" && e.status !== "scheduled") return false;
    if (filter === "completed" && e.status !== "completed") return false;
    
    // Type filter
    if (typeFilter !== "all" && e.evaluation_type !== typeFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.title?.toLowerCase().includes(term) ||
        e.project_title?.toLowerCase().includes(term) ||
        e.group_name?.toLowerCase().includes(term)
      );
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

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-yellow-100 text-yellow-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const formatDate = (date) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
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

  // ==================== CREATE VIEW ====================
  if (view === "create") {
    return (
      <div className="form-enter rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Schedule Evaluation</h2>
            <p className="mt-2 text-slate-600">
              Create a new sprint, milestone, or weekly update for student groups.
            </p>
          </div>
          <button
            onClick={() => {
              setView("list");
              resetForm();
            }}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            type="button"
          >
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Evaluation Type */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">📋 Evaluation Type</h3>
              <p className="mt-1 text-sm text-slate-500">Select the type of evaluation you want to schedule</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: "sprint", label: "Sprint Review", icon: "🏃", desc: "Regular sprint check-in" },
                { value: "weekly", label: "Weekly Update", icon: "📅", desc: "Weekly progress meeting" },
                { value: "milestone", label: "Milestone", icon: "🎯", desc: "Major project milestone" },
                { value: "final", label: "Final Presentation", icon: "🎓", desc: "End of project evaluation" },
              ].map((type) => (
                <label
                  key={type.value}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                    formData.evaluation_type === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="evaluation_type"
                    value={type.value}
                    checked={formData.evaluation_type === type.value}
                    onChange={handleFormChange}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className="text-sm font-medium text-slate-800">{type.label}</span>
                  <span className="text-xs text-slate-500 text-center mt-1">{type.desc}</span>
                  {formData.evaluation_type === type.value && (
                    <div className="absolute top-2 right-2">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">📝 Basic Information</h3>
              <p className="mt-1 text-sm text-slate-500">Essential details about this evaluation</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                placeholder="e.g., Sprint 3 Review"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows="3"
                placeholder="What will be covered in this evaluation?"
                className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-1.5 text-xs text-slate-500">Provide details about the evaluation agenda</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Group
                </label>
                <select
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All groups / No specific group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.project_title || g.group_name || g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Project
                </label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All projects / No specific project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">📆 Schedule</h3>
              <p className="mt-1 text-sm text-slate-500">When and where will this evaluation take place</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Time
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-1.5 text-xs text-slate-500">Deadline for submissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="e.g., Room 101 or Online"
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="meeting_link"
                  value={formData.meeting_link}
                  onChange={handleFormChange}
                  placeholder="https://zoom.us/j/..."
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-1.5 text-xs text-slate-500">Video conferencing link for remote meetings</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">📋 Additional Information</h3>
              <p className="mt-1 text-sm text-slate-500">Optional details about this evaluation</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Evaluator Name
              </label>
              <input
                type="text"
                name="evaluator_name"
                value={formData.evaluator_name}
                onChange={handleFormChange}
                placeholder="Who will conduct this evaluation?"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                placeholder="Any additional instructions or requirements..."
                className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => {
                setView("list");
                resetForm();
              }}
              className="rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || !formData.title || !formData.scheduled_date}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formLoading ? "Scheduling..." : "Schedule Evaluation"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==================== LIST VIEW ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Evaluations</h2>
          <p className="text-slate-500 text-sm mt-1">
            Schedule and manage sprints, milestones, and weekly updates
          </p>
        </div>

        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Evaluation
        </button>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
          "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage({ type: "", text: "" })}
            className="float-right text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search evaluations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
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
      </div>

      {/* Stats Cards */}
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
            {evaluations.filter(e => e.status === "in_progress").length}
          </div>
          <div className="text-xs text-blue-600">In Progress</div>
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
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Evaluations Found</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm || filter !== "all" || typeFilter !== "all" 
              ? "Try adjusting your filters" 
              : "Schedule your first evaluation to get started"}
          </p>
          <button
            onClick={() => setView("create")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Evaluation
          </button>
        </div>
      ) : (
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(evaluation.evaluation_type)}`}>
                        {evaluation.evaluation_type?.charAt(0).toUpperCase() + evaluation.evaluation_type?.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                        {evaluation.status?.replace("_", " ").charAt(0).toUpperCase() + evaluation.status?.slice(1).replace("_", " ")}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {evaluation.title}
                    </h3>
                    
                    {evaluation.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{evaluation.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {evaluation.meeting_link && (
                      <a
                        href={evaluation.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join
                      </a>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={evaluation.status}
                      onChange={(e) => handleStatusChange(evaluation.id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => handleDelete(evaluation.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}