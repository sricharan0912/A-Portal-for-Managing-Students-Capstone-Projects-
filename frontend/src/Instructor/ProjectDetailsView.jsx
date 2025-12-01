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
      const res = await apiCall(`/projects/${id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ 
          approval_status: newStatus,
          feedback: feedback 
        }),
      });
      
      setMessage(`✅ Project ${newStatus} successfully!`);
      setProject((prev) => ({ ...prev, approval_status: newStatus, instructor_feedback: feedback }));
      
      // Redirect back to projects list after 2 seconds
      setTimeout(() => {
        navigate("/instructor-dashboard/projects");
      }, 2000);
    } catch (err) {
      console.error("Error updating project:", err);
      setMessage("❌ Failed to update project status.");
    }
  };

  // Helper to get approval status display
  const getApprovalStatusDisplay = () => {
    const status = project.approval_status || "pending";
    switch (status) {
      case "approved":
        return { text: "Approved", className: "bg-green-100 text-green-700" };
      case "rejected":
        return { text: "Rejected", className: "bg-red-100 text-red-700" };
      default:
        return { text: "Pending", className: "bg-yellow-100 text-yellow-700" };
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

  const statusDisplay = getApprovalStatusDisplay();
  const isPending = project.approval_status === "pending" || !project.approval_status;

  // Project found - display details
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{project.title || "Untitled Project"}</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.className}`}>
          {statusDisplay.text}
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

      {/* Project Information */}
      <div className="space-y-4">
        {/* Basic Info */}
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

        {/* Client Information */}
        {(project.client_name || project.client_organization || project.client_email) && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Client Information</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              {(project.client_name || project.client_first_name) && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">
                    {project.client_name || `${project.client_first_name || ''} ${project.client_last_name || ''}`.trim()}
                  </span>
                </div>
              )}
              {project.client_organization && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm text-slate-600">{project.client_organization}</span>
                </div>
              )}
              {project.client_email && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${project.client_email}`} className="text-sm text-blue-600 hover:underline">
                    {project.client_email}
                  </a>
                </div>
              )}
              {project.client_website && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <a 
                    href={project.client_website.startsWith('http') ? project.client_website : `https://${project.client_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {project.client_website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-700">{project.description || "No description provided"}</p>
          </div>
        </div>

        {/* Skills Required */}
        {project.skills_required && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Skills Required</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                try {
                  const skills = typeof project.skills_required === 'string' 
                    ? JSON.parse(project.skills_required) 
                    : project.skills_required;
                  return Array.isArray(skills) ? skills.map((skill, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {skill}
                    </span>
                  )) : (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {project.skills_required}
                    </span>
                  );
                } catch {
                  return (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {project.skills_required}
                    </span>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* Instructor Feedback - Show for approved/rejected projects */}
        {project.instructor_feedback && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Instructor Feedback</p>
            <div className={`rounded-lg p-4 ${
              project.approval_status === "rejected"
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}>
              <p className={`text-sm ${
                project.approval_status === "rejected" ? "text-red-700" : "text-green-700"
              }`}>
                {project.instructor_feedback}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions for pending projects */}
      {isPending && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Feedback for Client
              <span className="text-slate-400 font-normal ml-1">(required for rejection)</span>
            </label>
            <textarea
              rows="3"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add feedback for the client..."
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
              onClick={() => {
                if (!feedback.trim()) {
                  setMessage("❌ Please provide feedback for rejection");
                  return;
                }
                handleUpdateStatus("rejected");
              }}
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

      {/* Back button for approved/rejected projects */}
      {!isPending && (
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