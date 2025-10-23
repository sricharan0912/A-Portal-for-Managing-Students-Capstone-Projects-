// src/utils/apiHelper.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

function buildUrl(url) {
  if (/^https?:\/\//i.test(url)) return url; // allow absolute URLs without prefixing
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

export const getInstructorStats = async (instructorId) =>
  apiCall(`/instructor/${instructorId}/stats`, { method: "GET" });

export const getPendingProjects = async () =>
  apiCall("/instructor/pending-projects", { method: "GET" });

export const approveProject = async (projectId) =>
  apiCall(`/instructor/projects/${projectId}/approve`, { method: "PUT" });

export const rejectProject = async (projectId) =>
  apiCall(`/instructor/projects/${projectId}/reject`, { method: "PUT" });

export const runGroupingAlgorithm = async () =>
  apiCall("/instructor/assign-groups", { method: "POST" });

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
      if (result?.projects && Array.isArray(result.projects)) return result.projects;
    } catch {
      // try next endpoint
    }
  }

  throw new Error("Failed to fetch projects from all endpoints.");
};
