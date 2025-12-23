import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

const API_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

/**
 * Custom React hook to fetch available projects for students
 * 
 * Automatically fetches all instructor-approved projects that students
 * can browse and select as preferences. Handles loading state, errors,
 * and data normalization across different API response formats.
 * 
 * The hook:
 * - Fetches projects automatically on component mount
 * - Normalizes different response formats (array, { data: [] }, { projects: [] })
 * - Manages loading and error states
 * - Returns empty array on errors or unexpected formats
 * 
 * @hook
 * @returns {Object} Projects state and metadata
 * @returns {Array<Object>} returns.projects - Array of approved project objects
 * @returns {boolean} returns.loading - Loading state indicator
 * @returns {string|null} returns.error - Error message if fetch fails, null otherwise
 * 
 * @example
 * // Basic usage in a student projects page
 * function BrowseProjects() {
 *   const { projects, loading, error } = useStudentProjects();
 *   
 *   if (loading) return <div>Loading projects...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Available Projects ({projects.length})</h2>
 *       {projects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Using with filtering
 * function FilterableProjects() {
 *   const { projects, loading } = useStudentProjects();
 *   const [filtered, setFiltered] = useState([]);
 *   
 *   useEffect(() => {
 *     setFiltered(projects.filter(p => p.category === 'Web Development'));
 *   }, [projects]);
 *   
 *   return <ProjectList projects={filtered} />;
 * }
 * 
 * @example
 * // Checking if projects are available
 * function ProjectSelection() {
 *   const { projects, loading, error } = useStudentProjects();
 *   
 *   if (!loading && !error && projects.length === 0) {
 *     return <div>No approved projects available yet</div>;
 *   }
 *   
 *   return <ProjectGrid projects={projects} />;
 * }
 */
export const useStudentProjects = () => {
  /**
   * State: Array of approved project objects
   * Each project contains: { id, title, description, skills_required, client_name, ... }
   * @type {Array<Object>}
   */
  const [projects, setProjects] = useState([]);
  
  /**
   * State: Loading indicator during API fetch
   * @type {boolean}
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * State: Error message from failed fetch operation
   * @type {string|null}
   */
  const [error, setError] = useState(null);

  /**
   * Effect: Fetch available projects on component mount
   * 
   * Automatically loads all instructor-approved projects when the component
   * using this hook is mounted. Handles multiple response formats and
   * updates all related state (projects, loading, error).
   * 
   * Only runs once on mount (empty dependency array).
   * 
   * Dependencies: []
   */
  useEffect(() => {
    /**
     * Internal async function to load projects from API
     * 
     * Fetches approved projects from the backend and normalizes
     * the response format. Handles errors gracefully and updates state.
     * 
     * @async
     * @function loadProjects
     * @returns {Promise<void>}
     * @throws {Error} If API call fails (caught and stored in error state)
     */
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