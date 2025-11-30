import React, { useEffect, useState } from "react";
import { approveProject, rejectProject, getPendingProjects } from "../utils/apiHelper";

const ProjectApprovalView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, projectId: null, action: null, projectTitle: "" });
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getPendingProjects();
      // Filter to only show projects with pending approval_status
      const pendingProjects = (res.data || []).filter(
        (p) => p.approval_status === "pending" || !p.approval_status
      );
      setProjects(pendingProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open modal for approval WITH optional feedback
  const openApproveModal = (project) => {
    setFeedbackModal({ open: true, projectId: project.id, action: "approve", projectTitle: project.title });
    setFeedback("");
  };

  const handleApprove = async () => {
    try {
      setProcessing(feedbackModal.projectId);
      await approveProject(feedbackModal.projectId, feedback); // Now includes feedback!
      setFeedbackModal({ open: false, projectId: null, action: null, projectTitle: "" });
      setFeedback("");
      fetchProjects(); // Refresh list
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Failed to approve project: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (project) => {
    setFeedbackModal({ open: true, projectId: project.id, action: "reject", projectTitle: project.title });
    setFeedback("");
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert("Please provide feedback for the rejection");
      return;
    }

    try {
      setProcessing(feedbackModal.projectId);
      await rejectProject(feedbackModal.projectId, feedback);
      setFeedbackModal({ open: false, projectId: null, action: null, projectTitle: "" });
      setFeedback("");
      fetchProjects();
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Failed to reject project: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ open: false, projectId: null, action: null, projectTitle: "" });
    setFeedback("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
        <span className="ml-2 text-slate-600">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Review Client Projects</h2>
        <p className="text-slate-600 mt-1">Approve or reject client-submitted projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
          <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 font-medium">No pending projects!</p>
          <p className="text-green-600 text-sm mt-1">All projects have been reviewed</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-800">{project.title}</h3>
                  <p className="text-slate-600 mt-1 text-sm line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.category && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {project.category}
                      </span>
                    )}
                    {project.complexity_level && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        {project.complexity_level}
                      </span>
                    )}
                    {project.client_name && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                        Client: {project.client_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openApproveModal(project)}
                    disabled={processing === project.id}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {processing === project.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(project)}
                    disabled={processing === project.id}
                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal for Approval/Rejection */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${feedbackModal.action === "reject" ? "bg-red-100" : "bg-green-100"}`}>
                {feedbackModal.action === "reject" ? (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {feedbackModal.action === "reject" ? "Reject Project" : "Approve Project"}
                </h3>
                <p className="text-sm text-slate-600">
                  {feedbackModal.projectTitle}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Feedback for Client
                {feedbackModal.action === "reject" && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={feedbackModal.action === "reject" 
                  ? "Explain why this project is being rejected and what changes are needed..." 
                  : "Add any comments or suggestions for the client (optional)..."}
                className={`w-full h-32 p-3 border rounded-lg text-sm resize-none focus:ring-2 ${
                  feedbackModal.action === "reject" 
                    ? "border-slate-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300 focus:ring-green-500 focus:border-green-500"
                }`}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                {feedbackModal.action === "reject" 
                  ? "This feedback will be visible to the client explaining the rejection."
                  : "Optional feedback that will be visible to the client."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeFeedbackModal}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              {feedbackModal.action === "reject" ? (
                <button
                  onClick={handleReject}
                  disabled={!feedback.trim() || processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Rejecting..." : "Reject Project"}
                </button>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Approving..." : "Approve Project"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectApprovalView;