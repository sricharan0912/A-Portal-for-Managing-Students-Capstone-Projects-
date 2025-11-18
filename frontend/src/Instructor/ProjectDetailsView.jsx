// src/pages/InstructorDashboard/ProjectDetailsView.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInstructorProjectById, updateProjectStatus } from "../utils/apiHelper";

/**
 * Instructor → Project Details Page
 * Displays full project info with approve/reject actions.
 */
export default function ProjectDetailsView() {
  const { id } = useParams(); // ✅ correctly reads /projects/:id
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) {
          console.error("❌ No project ID found in URL");
          setMessage("Invalid project ID");
          setLoading(false);
          return;
        }

        console.log("Fetching project with ID:", id);
        const data = await getInstructorProjectById(id);
        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setMessage("Project not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    try {
      const res = await updateProjectStatus(id, status, feedback);
      if (res.success) {
        setMessage(`✅ Project ${status} successfully.`);
        setProject((prev) => ({ ...prev, status }));
      } else {
        setMessage("⚠️ Failed to update project.");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setMessage("❌ Something went wrong.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-slate-600">
        Loading project details...
      </div>
    );

  if (!project)
    return (
      <div className="text-center py-10 text-slate-500">
        Project not found.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Project Details</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.status === "Approved"
              ? "bg-green-100 text-green-700"
              : project.status === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : project.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {project.status || "Pending"}
        </span>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Project Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <InfoItem label="Title" value={project.title} />
        <InfoItem label="Client" value={project.client || "N/A"} />
        <InfoItem label="Category" value={project.category || "N/A"} />
        <InfoItem
          label="Deadline"
          value={
            project.deadline
              ? new Date(project.deadline).toLocaleDateString()
              : "Not set"
          }
        />
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Description
        </h3>
        <p className="text-slate-700 text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 whitespace-pre-line">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* Feedback Area */}
      <div>
        <label
          htmlFor="feedback"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Instructor Feedback (optional)
        </label>
        <textarea
          id="feedback"
          rows="3"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter comments or notes..."
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => handleUpdateStatus("Approved")}
          className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-semibold hover:bg-green-500 transition focus:ring-2 focus:ring-green-300"
        >
          Approve
        </button>
        <button
          onClick={() => handleUpdateStatus("Rejected")}
          className="rounded-lg bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition focus:ring-2 focus:ring-red-300"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

/** Reusable info item */
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
