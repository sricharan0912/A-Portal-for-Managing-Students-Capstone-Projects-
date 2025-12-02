import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/apiHelper";

/**
 * Instructor → Schedule Evaluation Form
 * Create sprints, milestones, weekly updates, and final evaluations
 */
export default function ScheduleEvaluationForm() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch groups
      const groupsRes = await apiCall("/instructors/groups", { method: "GET" });
      setGroups(groupsRes.data || []);

      // Fetch projects
      const projectsRes = await apiCall("/projects", { method: "GET" });
      setProjects((projectsRes.data || []).filter(p => p.approval_status === "approved"));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleChange = (e) => {
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
    setLoading(true);
    setMessage({ type: "", text: "" });

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
        setTimeout(() => {
          navigate("/instructor-dashboard/evaluations");
        }, 1500);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to schedule evaluation" });
      }
    } catch (err) {
      console.error("Error scheduling evaluation:", err);
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const evaluationTypes = [
    { value: "sprint", label: "Sprint Review", icon: "🏃", description: "Regular sprint check-in" },
    { value: "weekly", label: "Weekly Update", icon: "📅", description: "Weekly progress meeting" },
    { value: "milestone", label: "Milestone", icon: "🎯", description: "Major project milestone" },
    { value: "final", label: "Final Presentation", icon: "🎓", description: "End of project evaluation" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/instructor-dashboard/evaluations")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Evaluations
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Schedule Evaluation</h2>
        <p className="text-slate-500 text-sm mt-1">
          Create a new sprint, milestone, or weekly update for student groups
        </p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`mb-6 rounded-lg p-4 ${
          message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
          "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Evaluation Type Cards */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-4">
            Evaluation Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {evaluationTypes.map((type) => (
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
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-2xl mb-2">{type.icon}</span>
                <span className="text-sm font-medium text-slate-800">{type.label}</span>
                <span className="text-xs text-slate-500 text-center mt-1">{type.description}</span>
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

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
            Basic Information
          </h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Sprint 3 Review"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="What will be covered in this evaluation?"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Group & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Group
              </label>
              <select
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
            Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time
              </label>
              <input
                type="time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Room 101 or Online"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
            Additional Information
          </h3>

          {/* Evaluator */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Evaluator Name
            </label>
            <input
              type="text"
              name="evaluator_name"
              value={formData.evaluator_name}
              onChange={handleChange}
              placeholder="Who will conduct this evaluation?"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional instructions or requirements..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/instructor-dashboard/evaluations")}
            className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scheduling...
              </span>
            ) : (
              "Schedule Evaluation"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}