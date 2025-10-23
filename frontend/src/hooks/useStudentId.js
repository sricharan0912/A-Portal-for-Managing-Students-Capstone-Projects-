import { useMemo } from "react";

/**
 * Custom hook to extract and manage student ID from localStorage
 * Handles both Firebase UID (string) and numeric ID formats
 * 
 * Returns the numeric student ID or null if not found/invalid
 */
export const useStudentId = () => {
  return useMemo(() => {
    try {
      const studentData = localStorage.getItem("student");
      
      if (!studentData) {
        console.warn("No student data found in localStorage");
        return null;
      }

      const student = JSON.parse(studentData);

      if (!student?.id) {
        console.warn("Student ID not found in student data");
        return null;
      }

      console.log("Raw student.id:", student.id, "Type:", typeof student.id);

      // If id is already a number, use it directly
      if (typeof student.id === "number") {
        console.log("Using numeric id:", student.id);
        return student.id;
      }

      // If id is a Firebase UID string and we have numeric_id, use that
      if (student.numeric_id && typeof student.numeric_id === "number") {
        console.log("Using numeric_id:", student.numeric_id);
        return student.numeric_id;
      }

      // If it looks like a Firebase UID (long alphanumeric string), try numeric_id first
      if (typeof student.id === "string" && student.id.length > 20) {
        console.warn(
          "Student ID appears to be Firebase UID, not numeric:",
          student.id
        );
        
        // Try to parse numeric_id if available
        if (student.numeric_id) {
          return student.numeric_id;
        }
      }

      // Try to parse the id as a number
      if (typeof student.id === "string") {
        const numeric = parseInt(student.id, 10);
        if (!isNaN(numeric) && numeric > 0) {
          console.log("Parsed numeric id from string:", numeric);
          return numeric;
        }
      }

      console.warn("Could not extract valid numeric student ID");
      return null;
    } catch (error) {
      console.error("Error in useStudentId:", error);
      return null;
    }
  }, []);
};