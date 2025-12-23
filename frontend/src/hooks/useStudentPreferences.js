import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

const API_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

/**
 * Custom React hook to fetch and manage student project preferences
 * 
 * Handles loading state, errors, data normalization, and deadline information.
 * Automatically fetches preferences when component mounts or when studentId changes.
 * Supports multiple API response formats for backward compatibility.
 * 
 * Features:
 * - Automatic data fetching on mount and studentId change
 * - Loading and error state management
 * - Multiple response format support (array, { data: [] }, { preferences: [] })
 * - Deadline and last updated tracking
 * - Preference submission with automatic refresh
 * 
 * @hook
 * @param {number} studentId - The numeric student ID
 * @returns {Object} Preferences state and actions
 * @returns {Array<Object>} returns.preferences - Array of preference objects with project details
 * @returns {Function} returns.setPreferences - State setter for manual preference updates
 * @returns {boolean} returns.loading - Loading state indicator
 * @returns {string|null} returns.error - Error message if fetch/submit fails
 * @returns {Function} returns.submitPreferences - Function to submit preferences to API
 * @returns {string|null} returns.lastUpdated - ISO timestamp of last preference update
 * @returns {string|null} returns.deadline - ISO timestamp of preference submission deadline
 * 
 * @example
 * // Basic usage in a component
 * function StudentPreferencePage() {
 *   const studentId = useStudentId();
 *   const { 
 *     preferences, 
 *     loading, 
 *     error, 
 *     submitPreferences,
 *     deadline 
 *   } = useStudentPreferences(studentId);
 *   
 *   if (loading) return <div>Loading preferences...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Your Preferences (Deadline: {deadline})</h2>
 *       {preferences.map(p => (
 *         <div key={p.project_id}>
 *           Rank {p.preference_rank}: {p.project_title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Submitting preferences
 * const { submitPreferences } = useStudentPreferences(studentId);
 * 
 * const handleSubmit = async () => {
 *   const prefs = [
 *     { project_id: 5, preference_rank: 1 },
 *     { project_id: 12, preference_rank: 2 },
 *     { project_id: 8, preference_rank: 3 }
 *   ];
 *   
 *   try {
 *     await submitPreferences(prefs);
 *     alert('Preferences submitted successfully!');
 *   } catch (error) {
 *     alert('Failed to submit: ' + error.message);
 *   }
 * };
 */
export const useStudentPreferences = (studentId) => {
  /**
   * State: Array of student preference objects
   * Each object contains: { project_id, project_title, preference_rank, ... }
   * @type {Array<Object>}
   */
  const [preferences, setPreferences] = useState([]);
  
  /**
   * State: Loading indicator for fetch/submit operations
   * @type {boolean}
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * State: Error message from failed operations
   * @type {string|null}
   */
  const [error, setError] = useState(null);
  
  /**
   * State: ISO timestamp of last preference update
   * @type {string|null}
   */
  const [lastUpdated, setLastUpdated] = useState(null);
  
  /**
   * State: ISO timestamp of preference submission deadline
   * @type {string|null}
   */
  const [deadline, setDeadline] = useState(null);

  /**
   * Effect: Fetch preferences on mount or when studentId changes
   * 
   * Automatically loads student preferences from the API.
   * Handles multiple response formats for backward compatibility.
   * Updates all related state (preferences, lastUpdated, deadline).
   * 
   * Dependencies: [studentId]
   */
  useEffect(() => {
    if (!studentId) {
      console.log("useStudentPreferences: studentId not available, skipping fetch");
      return;
    }

    /**
     * Internal async function to load preferences from API
     * 
     * @async
     * @function loadPreferences
     * @returns {Promise<void>}
     * @throws {Error} If API call fails
     */
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("useStudentPreferences: Fetching preferences for studentId:", studentId);

        const data = await apiCall(
          `${API_URL}/students/${studentId}/preferences`,
          { method: "GET" }
        );

        console.log("useStudentPreferences: Preferences data received:", data);

        // Handle response format { success: true, data: [...], lastUpdated, deadline }
        if (Array.isArray(data)) {
          // Direct array response
          setPreferences(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          // { success: true, data: [...] } format
          setPreferences(data.data);
          
          // Extract lastUpdated and deadline if present
          if (data.lastUpdated) {
            setLastUpdated(data.lastUpdated);
          }
          if (data.deadline) {
            setDeadline(data.deadline);
          }
        } else if (data && Array.isArray(data.preferences)) {
          // { preferences: [...] } format
          setPreferences(data.preferences);
        } else {
          // Fallback: no valid data found
          console.warn("useStudentPreferences: Unexpected data format, setting empty array");
          setPreferences([]);
        }
      } catch (err) {
        console.error("useStudentPreferences: Error fetching preferences:", err);
        setError(err.message || "Failed to fetch preferences");
        setPreferences([]);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [studentId]);

  /**
   * Submit student project preferences to the API
   * 
   * Sends preference data to the backend and automatically refreshes
   * the preferences list after successful submission.
   * Updates lastUpdated and deadline from the response.
   * 
   * @async
   * @function submitPreferences
   * @param {Array<Object>} preferencesData - Array of preference objects
   * @param {number} preferencesData[].project_id - Project ID being preferred
   * @param {number} preferencesData[].preference_rank - Rank (1-3, where 1 is highest)
   * @returns {Promise<Object>} API response object
   * @throws {Error} If submission fails or API returns error
   * 
   * @example
   * await submitPreferences([
   *   { project_id: 5, preference_rank: 1 },
   *   { project_id: 12, preference_rank: 2 },
   *   { project_id: 8, preference_rank: 3 }
   * ]);
   */
  const submitPreferences = async (preferencesData) => {
    try {
      console.log(
        "useStudentPreferences: Submitting preferences for studentId:",
        studentId
      );

      const response = await apiCall(
        `${API_URL}/students/${studentId}/preferences`,
        {
          method: "POST",
          body: JSON.stringify({ preferences: preferencesData }),
        }
      );

      console.log("useStudentPreferences: Preferences submitted successfully:", response);

      // Refresh preferences after submission
      const updatedData = await apiCall(
        `${API_URL}/students/${studentId}/preferences`,
        { method: "GET" }
      );

      // Handle response format { success: true, data: [...], lastUpdated, deadline }
      if (Array.isArray(updatedData)) {
        setPreferences(updatedData);
      } else if (updatedData && updatedData.data && Array.isArray(updatedData.data)) {
        // { success: true, data: [...] } format
        setPreferences(updatedData.data);
        
        // Update lastUpdated and deadline if present
        if (updatedData.lastUpdated) {
          setLastUpdated(updatedData.lastUpdated);
        }
        if (updatedData.deadline) {
          setDeadline(updatedData.deadline);
        }
      } else if (updatedData && Array.isArray(updatedData.preferences)) {
        // { preferences: [...] } format
        setPreferences(updatedData.preferences);
      } else {
        console.warn("useStudentPreferences: Unexpected data format after submission");
        setPreferences([]);
      }

      return response;
    } catch (err) {
      console.error("useStudentPreferences: Error submitting preferences:", err);
      setError(err.message || "Failed to submit preferences");
      throw err;
    }
  };

  return {
    preferences,
    setPreferences,
    loading,
    error,
    submitPreferences,
    lastUpdated,
    deadline,
  };
};