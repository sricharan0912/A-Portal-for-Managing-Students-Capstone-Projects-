import React, { useEffect, useState } from "react";
import { approveProject, rejectProject, getPendingProjects } from "../utils/apiHelper";

const ProjectApprovalView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getPendingProjects();
      setProjects(res.data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveProject(id);
      fetchProjects(); // Refresh list
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectProject(id);
      fetchProjects();
    } catch (error) {
      console.error("Rejection failed:", error);
    }
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="project-approval-container">
      <h2>Review Client-Submitted Projects</h2>
      {projects.length === 0 ? (
        <p>No pending projects 🎉</p>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <p><strong>Client:</strong> {project.client_name || "Unknown"}</p>
              <div className="actions">
                <button onClick={() => handleApprove(project.id)} className="approve">
                  ✅ Approve
                </button>
                <button onClick={() => handleReject(project.id)} className="reject">
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectApprovalView;
