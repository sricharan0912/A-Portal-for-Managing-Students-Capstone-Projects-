import { useEffect, useRef, useState, useCallback } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Fetch and manage a client's projects.
 * - Primary endpoint:   GET /clients/:clientId/projects
 * - Fallback endpoint:  GET /projects/client/:clientId
 */
export const useProjects = (clientId) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const abortRef = useRef(null);

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
