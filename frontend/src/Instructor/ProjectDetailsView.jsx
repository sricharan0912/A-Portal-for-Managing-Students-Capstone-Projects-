// src/pages/InstructorDashboard/ProjectDetailsView.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiCall } from "../utils/apiHelper";

export default function ProjectDetailsView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract ID from pathname (e.g., "/instructor-dashboard/projects/6" -> "6")
  const pathParts = location.pathname.split('/');
  const id = pathParts[pathParts.length - 1]; // Get the last part of the path
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("=== ProjectDetailsView: Starting fetch ===");
        console.log("Full pathname:", location.pathname);
        console.log("Extracted ID from URL:", id);
        console.log("Type of ID:", typeof id);
        
        if (!id || isNaN(id)) {
          console.error("Invalid project ID:", id);
          setMessage("Invalid project ID");
          setLoading(false);
          return;
        }
        
        // Fetch all projects
        const response = await apiCall("/projects", { method: "GET" });
        console.log("Raw API response:", response);
        
        // Handle the response - it seems to be directly an array
        let projectsList = [];
        if (Array.isArray(response)) {
          projectsList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          projectsList = response.data;
        } else if (response?.projects && Array.isArray(response.projects)) {
          projectsList = response.projects;
        }
        
        console.log("Projects list:", projectsList);
        console.log("Looking for project with ID:", id);
        
        // Find the project - convert ID to number for comparison
        const projectId = parseInt(id);
        const foundProject = projectsList.find(p => p.id === projectId);
        
        console.log("Found project:", foundProject);
        
        if (foundProject) {
          setProject(foundProject);
        } else {
          console.error(`No project found with ID ${id}`);
          setMessage("Project not found.");
        }
      } catch (err) {
        console.error("Error in fetchProject:", err);
        setMessage("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProject();
    } else {
      console.error("No ID found in URL");
      setLoading(false);
      setMessage("No project ID provided");
    }
  }, [id, location.pathname]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await apiCall(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          status: newStatus,
          feedback: feedback 
        }),
      });
      
      setMessage(`✅ Project ${newStatus} successfully!`);
      setProject((prev) => ({ ...prev, status: newStatus }));
      
      // Redirect back to projects list after 2 seconds
      setTimeout(() => {
        navigate("/instructor-dashboard/projects");
      }, 2000);
    } catch (err) {
      console.error("Error updating project:", err);
      setMessage("❌ Failed to update project status.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Project Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The requested project could not be found.
          </p>
          <button
            onClick={() => navigate("/instructor-dashboard/projects")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Project found - display details
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{project.title || "Untitled Project"}</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.status === "approved"
              ? "bg-green-100 text-green-700"
              : project.status === "open" || project.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : project.status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {project.status || "Unknown"}
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

      {/* Project Information - REMOVED CLIENT FIELD */}
      <div className="space-y-4">
        {/* Basic Info - Now 3 columns instead of 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Category</p>
            <p className="text-sm text-slate-800">{project.category || "Web Development"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Complexity</p>
            <p className="text-sm text-slate-800">{project.complexity_level || "intermediate"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Team Size</p>
            <p className="text-sm text-slate-800">{project.team_size || "4"} members</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-700">{project.description || "test"}</p>
          </div>
        </div>
      </div>

      {/* Actions for open projects */}
      {project.status === "open" && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Feedback (optional)
            </label>
            <textarea
              rows="3"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
              placeholder="Add any notes about this project..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => navigate("/instructor-dashboard/projects")}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateStatus("rejected")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => handleUpdateStatus("approved")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        </>
      )}

      {/* Back button for non-open projects */}
      {project.status !== "open" && (
        <div className="pt-4 border-t">
          <button
            onClick={() => navigate("/instructor-dashboard/projects")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            ← Back to Projects
          </button>
        </div>
      )}
    </div>
  );
}