import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

const API_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

/**
 * Custom hook to fetch available projects for students
 * Handles loading state, errors, and data normalization
 *
 * @returns {object} { projects, loading, error }
 */
export const useStudentProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("useStudentProjects: Fetching available projects");
        const data = await apiCall(`${API_URL}/students/projects`, {
          method: "GET",
        });

        console.log("useStudentProjects: Projects data received:", data);

        // Handle response format { success: true, data: [...] }
        if (Array.isArray(data)) {
          // Direct array response
          setProjects(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          // { success: true, data: [...] } format
          setProjects(data.data);
        } else if (data && Array.isArray(data.projects)) {
          // { projects: [...] } format
          setProjects(data.projects);
        } else {
          // Fallback: no valid data found
          console.warn("useStudentProjects: Unexpected data format, setting empty array");
          setProjects([]);
        }
      } catch (err) {
        console.error("useStudentProjects: Error fetching projects:", err);
        setError(err.message || "Failed to fetch projects");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return {
    projects,
    loading,
    error,
  };
};