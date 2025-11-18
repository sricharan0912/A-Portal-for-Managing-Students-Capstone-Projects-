import React, { useState } from "react";
import { createNewProject } from "../utils/apiHelper";

/**
 * Instructor → Create Project Form
 * Matches reference screenshots: clean white form card, blue theme.
 */
export default function CreateProjectForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    teamSize: "",
    deadline: "",
    skills: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await createNewProject(formData);
      if (res.success) {
        setMessage("✅ Project created successfully!");
        setFormData({
          title: "",
          description: "",
          category: "",
          subcategory: "",
          teamSize: "",
          deadline: "",
          skills: "",
        });
      } else {
        setMessage("⚠️ Failed to create project.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Create New Project
      </h2>

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
        {/* Project Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Project Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter project title"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
            placeholder="Enter project description"
          />
        </div>

        {/* Category / Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="e.g. Web Development"
            />
          </div>

          <div>
            <label
              htmlFor="subcategory"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Subcategory
            </label>
            <input
              id="subcategory"
              name="subcategory"
              type="text"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="e.g. React / Node.js"
            />
          </div>
        </div>

        {/* Team Size / Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="teamSize"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Team Size
            </label>
            <input
              id="teamSize"
              name="teamSize"
              type="number"
              min="1"
              value={formData.teamSize}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="e.g. 3"
            />
          </div>

          <div>
            <label
              htmlFor="deadline"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Deadline
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label
            htmlFor="skills"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Required Skills / Tags
          </label>
          <input
            id="skills"
            name="skills"
            type="text"
            value={formData.skills}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="e.g. HTML, CSS, React, SQL"
          />
          <p className="text-xs text-slate-500 mt-1">
            Separate multiple skills with commas.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/instructor-dashboard/projects")
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
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
