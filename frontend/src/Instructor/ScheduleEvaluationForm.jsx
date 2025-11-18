import React, { useState, useEffect } from "react";
import { getInstructorGroups, scheduleEvaluation } from "../utils/apiHelper";

/**
 * Instructor → Schedule Evaluation Form
 */
export default function ScheduleEvaluationForm() {
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    groupId: "",
    date: "",
    time: "",
    evaluator: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getInstructorGroups();
        setGroups(res.data || []);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await scheduleEvaluation(formData);
      if (res.success) {
        setMessage("✅ Evaluation scheduled successfully!");
        setFormData({ groupId: "", date: "", time: "", evaluator: "", notes: "" });
      } else {
        setMessage("⚠️ Failed to schedule evaluation.");
      }
    } catch {
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Schedule Evaluation</h2>

      {message && (
        <div
          className={`mb-5 rounded-lg px-4 py-3 text-sm font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Group
          </label>
          <select
            name="groupId"
            value={formData.groupId}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          >
            <option value="">Choose a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Evaluator */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Evaluator
          </label>
          <input
            type="text"
            name="evaluator"
            value={formData.evaluator}
            onChange={handleChange}
            placeholder="Enter evaluator name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any special instructions..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/instructor-dashboard/evaluations")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition"
          >
            {loading ? "Scheduling..." : "Schedule Evaluation"}
          </button>
        </div>
      </form>
    </div>
  );
}
