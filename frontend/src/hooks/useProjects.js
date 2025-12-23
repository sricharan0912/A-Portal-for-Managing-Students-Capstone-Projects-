import { useEffect, useRef, useState, useCallback } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Custom React hook to fetch and manage a client's projects
 * 
 * Implements robust project fetching with automatic fallback endpoints,
 * request cancellation, and optimistic updates support. Designed specifically
 * for client dashboards to display and manage their submitted projects.
 * 
 * Features:
 * - Automatic endpoint fallback (primary → fallback)
 * - Request cancellation on unmount or clientId change
 * - Multiple response format normalization
 * - Optimistic update support via setProjects
 * - Manual refetch capability
 * - AbortController for proper cleanup
 * 
 * Endpoints tried in order:
 * 1. Primary:  GET /clients/:clientId/projects
 * 2. Fallback: GET /projects/client/:clientId
 * 
 * @hook
 * @param {number} clientId - Client's numeric ID
 * @returns {Object} Projects state and control functions
 * @returns {Array<Object>} returns.projects - Array of project objects owned by client
 * @returns {Function} returns.setProjects - State setter for optimistic updates
 * @returns {boolean} returns.loading - Loading state indicator
 * @returns {string|null} returns.error - Error message if fetch fails
 * @returns {Function} returns.refetch - Function to manually reload projects
 * 
 * @example
 * // Basic usage in client dashboard
 * function ClientDashboard() {
 *   const clientId = useClientId();
 *   const { projects, loading, error } = useProjects(clientId);
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *   
 *   return (
 *     <div>
 *       <h2>My Projects ({projects.length})</h2>
 *       {projects.map(p => (
 *         <ProjectCard key={p.id} project={p} />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Using refetch after creating a new project
 * function CreateProjectForm() {
 *   const clientId = useClientId();
 *   const { refetch } = useProjects(clientId);
 *   
 *   const handleSubmit = async (data) => {
 *     await createClientProject(data);
 *     await refetch(); // Reload projects list
 *     toast.success('Project created!');
 *   };
 *   
 *   return <ProjectForm onSubmit={handleSubmit} />;
 * }
 * 
 * @example
 * // Optimistic updates when deleting
 * function ProjectList() {
 *   const clientId = useClientId();
 *   const { projects, setProjects, refetch } = useProjects(clientId);
 *   
 *   const handleDelete = async (projectId) => {
 *     // Optimistic update
 *     setProjects(prev => prev.filter(p => p.id !== projectId));
 *     
 *     try {
 *       await deleteClientProject(projectId);
 *     } catch (error) {
 *       // Rollback on error
 *       await refetch();
 *       toast.error('Failed to delete');
 *     }
 *   };
 *   
 *   return <ProjectGrid projects={projects} onDelete={handleDelete} />;
 * }
 * 
 * @example
 * // Handling empty state
 * function ClientProjects() {
 *   const { projects, loading, error } = useProjects(clientId);
 *   
 *   if (!loading && !error && projects.length === 0) {
 *     return (
 *       <EmptyState 
 *         message="No projects yet" 
 *         action={<CreateProjectButton />}
 *       />
 *     );
 *   }
 *   
 *   return <ProjectList projects={projects} />;
 * }
 */
export const useProjects = (clientId) => {
  /**
   * State: Array of project objects owned by the client
   * Each project contains: { id, title, description, status, approval_status, ... }
   * @type {Array<Object>}
   */
  const [projects, setProjects] = useState([]);
  
  /**
   * State: Loading indicator during fetch operations
   * @type {boolean}
   */
  const [loading, setLoading]   = useState(false);
  
  /**
   * State: Error message from failed fetch attempts
   * @type {string|null}
   */
  const [error, setError]       = useState(null);
  
  /**
   * Ref: AbortController for request cancellation
   * Stores current fetch request controller for cleanup on unmount or new fetch
   * @type {React.MutableRefObject<AbortController|null>}
   */
  const abortRef = useRef(null);

  /**
   * Load projects from API with fallback endpoint support
   * 
   * Attempts to fetch from primary endpoint first, then falls back to
   * secondary endpoint if primary fails. Normalizes different response
   * formats and handles request cancellation properly.
   * 
   * @async
   * @function loadProjects
   * @returns {Promise<void>}
   * @throws {Error} If both endpoints fail (caught and stored in error state)
   * 
   * @example
   * // Called automatically by useEffect, but can be called manually:
   * const { refetch } = useProjects(clientId);
   * await refetch(); // Manually reload
   */
  const loadProjects = useCallback(async () => {
    if (!clientId) return;
    // cancel any in-flight request
    abortRef.current?.abort?.();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Primary
      let data;
      try {
        data = await apiCall(`/clients/${clientId}/projects`, {
          method: "GET",
          signal: abortRef.current.signal,
        });
      } catch (e) {
        // Fallback
        data = await apiCall(`/projects/client/${clientId}`, {
          method: "GET",
          signal: abortRef.current.signal,
        });
      }

      // Normalize
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data && Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else if (data && Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Effect: Fetch projects when clientId changes and cleanup on unmount
   * 
   * Automatically loads projects when component mounts or when clientId changes.
   * Cancels any pending requests when component unmounts or clientId changes
   * to prevent memory leaks and state updates on unmounted components.
   * 
   * Dependencies: [loadProjects]
   */
  useEffect(() => {
    loadProjects();
    return () => abortRef.current?.abort?.();
  }, [loadProjects]);

  return {
    projects,
    setProjects,   // allow local optimistic updates
    loading,
    error,
    refetch: loadProjects,
  };
};