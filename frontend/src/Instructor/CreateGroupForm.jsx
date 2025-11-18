import React, { useState, useEffect } from "react";
import { getInstructorProjects, getInstructorStudents, createNewGroup } from "../utils/apiHelper";

/**
 * Instructor → Create Group Form
 * Manual group creation form matching your screenshots & dashboard theme.
 */
export default function CreateGroupForm() {
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    groupName: "",
    projectId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await getInstructorProjects();
        const studRes = await getInstructorStudents();
        setProjects(projRes.data || []);
        setStudents(studRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await createNewGroup({
        name: formData.groupName,
        projectId: formData.projectId,
        members: selectedStudents,
        notes: formData.notes,
      });
      if (res.success) {
        setMessage("✅ Group created successfully!");
        setFormData({ groupName: "", projectId: "", notes: "" });
        setSelectedStudents([]);
      } else {
        setMessage("⚠️ Failed to create group.");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Group</h2>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group Name */}
        <div>
          <label
            htmlFor="groupName"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Group Name
          </label>
          <input
            id="groupName"
            name="groupName"
            type="text"
            value={formData.groupName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter group name (e.g., Team Alpha)"
          />
        </div>

        {/* Select Project */}
        <div>
          <label
            htmlFor="projectId"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Assign Project
          </label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white"
          >
            <option value="">Select a project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>
        </div>

        {/* Select Students */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Students
          </label>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
            {students.length > 0 ? (
              students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center justify-between bg-white hover:bg-slate-100 rounded-md px-3 py-2 mb-1 cursor-pointer border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudentSelection(student.id)}
                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                </label>
              ))
            ) : (
              <p className="text-sm text-slate-500">No students available.</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional comments..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/instructor-dashboard/groups")
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
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
