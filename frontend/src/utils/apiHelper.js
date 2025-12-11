// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

function buildUrl(url) {
  if (/^https?:\/\//i.test(url)) return url; // allow absolute URLs
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Generic API call helper with token injection.
 */
export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(url), {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "API call failed");
  }

  return data;
};

/* ===================== CLIENT ===================== */

export const fetchClientProjects = async (clientId) =>
  apiCall(`/clients/${clientId}/projects`, { method: "GET" });

export const createClientProject = async (projectData) =>
  apiCall("/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });

export const updateClientProject = async (projectId, projectData) =>
  apiCall(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(projectData),
  });

export const deleteClientProject = async (projectId) =>
  apiCall(`/projects/${projectId}`, { method: "DELETE" });

/* ===================== STUDENT ===================== */

export const fetchAvailableProjects = async () =>
  apiCall("/students/projects", { method: "GET" });

export const fetchStudentPreferences = async (studentId) =>
  apiCall(`/students/${studentId}/preferences`, { method: "GET" });

export const submitStudentPreferences = async (studentId, preferences) =>
  apiCall(`/students/${studentId}/preferences`, {
    method: "POST",
    body: JSON.stringify({ preferences }),
  });

export const fetchStudentGroup = async (studentId) =>
  apiCall(`/students/${studentId}/group`, { method: "GET" });

/* ===================== INSTRUCTOR ===================== */

// Get instructor stats
export const getInstructorStats = async (instructorId) =>
  apiCall(`/instructors/${instructorId}/stats`, { method: "GET" });

// Get pending projects for approval
export const getPendingProjects = async () =>
  apiCall("/projects?status=open", { method: "GET" });

// Approve project (instructor only)
export const approveProject = async (projectId, feedback = "") =>
  apiCall(`/projects/${projectId}/approval`, {
    method: "PUT",
    body: JSON.stringify({ approval_status: "approved", feedback }),
  });

// Reject project with feedback (instructor only)
export const rejectProject = async (projectId, feedback = "") =>
  apiCall(`/projects/${projectId}/approval`, {
    method: "PUT",
    body: JSON.stringify({ approval_status: "rejected", feedback }),
  });

// Run grouping algorithm
export const runGroupingAlgorithm = async () =>
  apiCall("/instructors/assign-groups", { method: "POST" });

// Get all students (instructors can see all students in the system)
export const getInstructorStudents = async (instructorId) =>
  apiCall("/students", { method: "GET" });

export const addNewStudent = async (studentData) =>
  apiCall("/students/signup", {
    method: "POST",
    body: JSON.stringify(studentData),
  });

// Get all projects (instructors can see all projects in the system)
export const getInstructorProjects = async (instructorId) =>
  apiCall("/projects", { method: "GET" });

// Get project details by ID - This is the main function to use for both student and instructor
export const getProjectById = async (projectId) =>
  apiCall(`/projects/${projectId}`, { method: "GET" });

// REMOVED getInstructorProjectById - use getProjectById instead

// Update project status (approve, reject, or other updates)
export const updateProjectStatus = async (projectId, status, feedback = "") =>
  apiCall(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify({ status, feedback }),
  });

// Create a new project (Instructor can create projects on behalf of clients)
export const createNewProject = async (projectData) =>
  apiCall("/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });

// Get list of all groups
export const getInstructorGroups = async () =>
  apiCall("/instructors/groups", { method: "GET" });

// Auto assign students to groups (run algorithm)
export const autoAssignGroups = async () =>
  apiCall("/instructors/auto-assign-groups", { method: "POST" });

// Preview group formation without saving
export const previewGroups = async () =>
  apiCall("/instructors/preview-groups", { method: "POST" });

// Clear all groups
export const clearAllGroups = async () =>
  apiCall("/instructors/groups", { method: "DELETE" });

// Confirm or finalize auto-generated groups (deprecated - use autoAssignGroups)
export const confirmAutoGroups = async () =>
  apiCall("/instructors/auto-assign-groups", { method: "POST" });

// Get auto group formation statistics (included in autoAssignGroups response)
export const getAutoGroupStats = async () =>
  apiCall("/instructors/groups", { method: "GET" });

// Rerun the auto grouping algorithm again
export const rerunAutoGrouping = async () =>
  apiCall("/instructors/auto-assign-groups", { method: "POST" });

// Create a new group manually
export const createNewGroup = async (groupData) =>
  apiCall("/groups", {  // Changed from /instructor/groups to /groups
    method: "POST",
    body: JSON.stringify(groupData),
  });

// Remove student from a group (instructor only)
export const removeStudentFromGroup = async (groupId, studentId) =>
  apiCall(`/instructors/groups/${groupId}/members/${studentId}`, {
    method: "DELETE",
  });

// Add student to a group (instructor only)
export const addStudentToGroup = async (groupId, studentId) =>
  apiCall(`/instructors/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });

// Get all unassigned students (not in any group)
export const fetchUnassignedStudents = async () =>
  apiCall("/instructors/unassigned-students", { method: "GET" });

// Get all evaluations
export const getInstructorEvaluations = async () =>
  apiCall("/evaluations", { method: "GET" });  // Changed from /instructor/evaluations to /evaluations

// Schedule a new evaluation
export const scheduleEvaluation = async (payload) =>
  apiCall("/evaluations", {  // Changed from /instructor/evaluations to /evaluations
    method: "POST",
    body: JSON.stringify(payload),
  });

// Fetch instructor profile
export const getInstructorProfile = async (instructorId) =>
  apiCall(`/instructors/${instructorId}`, { method: "GET" });

// Update instructor profile
export const updateInstructorProfile = async (instructorId, profileData) =>
  apiCall(`/instructors/${instructorId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });

/* ===================== FALLBACK FETCH ===================== */

export const fetchProjectsWithFallback = async (clientId) => {
  const endpoints = [
    `/clients/${clientId}/projects`,
    `/projects/client/${clientId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await apiCall(endpoint, { method: "GET" });
      if (Array.isArray(result)) return result;
      if (result?.data && Array.isArray(result.data)) return result.data;
      if (result?.projects && Array.isArray(result.projects))
        return result.projects;
    } catch {
      // try next endpoint
    }
  }

  throw new Error("Failed to fetch projects from all endpoints.");
};