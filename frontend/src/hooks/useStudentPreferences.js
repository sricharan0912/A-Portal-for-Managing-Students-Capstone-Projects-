import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Custom hook to fetch and manage student project preferences
 * Handles loading state, errors, data normalization, and deadline info
 *
 * @param {number} studentId - The numeric student ID
 * @returns {object} { preferences, setPreferences, loading, error, submitPreferences, lastUpdated, deadline }
 */
export const useStudentPreferences = (studentId) => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deadline, setDeadline] = useState(null);

  // Fetch preferences on mount or when studentId changes
  useEffect(() => {
    if (!studentId) {
      console.log("useStudentPreferences: studentId not available, skipping fetch");
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("useStudentPreferences: Fetching preferences for studentId:", studentId);

        const data = await apiCall(
          `https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/students/${studentId}/preferences`,
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
   * Submit project preferences
   * @param {array} preferencesData - Array of preference objects with project_id and preference_rank
   * @returns {Promise<object>} - Response from API
   */
  const submitPreferences = async (preferencesData) => {
    try {
      console.log(
        "useStudentPreferences: Submitting preferences for studentId:",
        studentId
      );

      const response = await apiCall(
        `https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/students/${studentId}/preferences`,
        {
          method: "POST",
          body: JSON.stringify({ preferences: preferencesData }),
        }
      );

      console.log("useStudentPreferences: Preferences submitted successfully:", response);

      // Refresh preferences after submission
      const updatedData = await apiCall(
        `https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/students/${studentId}/preferences`,
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