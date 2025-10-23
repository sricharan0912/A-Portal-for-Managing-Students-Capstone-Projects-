/**
 * Response Formatter Utility
 * Standardizes all API responses to consistent format
 * Every response (success or error) follows the same structure
 * 
 * This makes frontend code simpler and more reliable
 * Frontend always knows response format will be: { success, data/error, message, code }
 * 
 * Usage in routes:
 * res.json(formatSuccess(data, "User created successfully"));
 * res.status(400).json(formatError("Validation failed", "VALIDATION_ERROR"));
 */

/**
 * Success Response Format
 * @param {*} data - The data to return
 * @param {string} message - Success message for user
 * @param {string} code - Optional code for frontend (e.g., "USER_CREATED")
 * @returns {object} Formatted success response
 * 
 * Example:
 * {
 *   success: true,
 *   message: "User created successfully",
 *   code: "USER_CREATED",
 *   data: { id: 1, name: "John", email: "john@example.com" }
 * }
 */
export const formatSuccess = (data, message = "Success", code = null) => {
  return {
    success: true,
    message,
    code,
    data,
  };
};

/**
 * Error Response Format
 * @param {string} error - Error message for user (user-friendly, not technical)
 * @param {string} code - Error code for frontend to handle (e.g., "INVALID_TOKEN")
 * @param {*} details - Optional detailed error info for debugging
 * @returns {object} Formatted error response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Email already registered",
 *   code: "DUPLICATE_EMAIL",
 *   details: null
 * }
 */
export const formatError = (error, code = "ERROR", details = null) => {
  return {
    success: false,
    error,
    code,
    ...(details && { details }),
  };
};

/**
 * List Response Format
 * For paginated or multiple item responses
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination info { page, limit, total, totalPages }
 * @param {string} message - Success message
 * @returns {object} Formatted list response
 * 
 * Example:
 * {
 *   success: true,
 *   message: "Projects fetched successfully",
 *   data: [...],
 *   pagination: { page: 1, limit: 10, total: 25, totalPages: 3 }
 * }
 */
export const formatList = (data, pagination = null, message = "Data fetched successfully") => {
  const response = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || data.length,
      totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
    };
  }

  return response;
};

/**
 * Created Resource Response
 * Use for POST requests that create new resources
 * @param {*} data - The newly created resource
 * @param {string} resourceName - Name of resource (e.g., "User", "Project")
 * @param {string} code - Optional success code
 * @returns {object} Formatted creation response
 * 
 * Example:
 * {
 *   success: true,
 *   message: "User created successfully",
 *   code: "USER_CREATED",
 *   data: { id: 1, name: "John" }
 * }
 */
export const formatCreated = (data, resourceName = "Resource", code = null) => {
  return {
    success: true,
    message: `${resourceName} created successfully`,
    code: code || `${resourceName.toUpperCase()}_CREATED`,
    data,
  };
};

/**
 * Updated Resource Response
 * Use for PUT/PATCH requests
 * @param {*} data - The updated resource (or null if not returning full resource)
 * @param {string} resourceName - Name of resource (e.g., "User", "Project")
 * @param {string} code - Optional success code
 * @returns {object} Formatted update response
 * 
 * Example:
 * {
 *   success: true,
 *   message: "Project updated successfully",
 *   code: "PROJECT_UPDATED",
 *   data: { id: 1, title: "New Title" }
 * }
 */
export const formatUpdated = (data = null, resourceName = "Resource", code = null) => {
  return {
    success: true,
    message: `${resourceName} updated successfully`,
    code: code || `${resourceName.toUpperCase()}_UPDATED`,
    ...(data && { data }),
  };
};

/**
 * Deleted Resource Response
 * Use for DELETE requests
 * @param {string} resourceName - Name of resource (e.g., "User", "Project")
 * @param {*} deletedData - Optional data of deleted resource for confirmation
 * @param {string} code - Optional success code
 * @returns {object} Formatted deletion response
 * 
 * Example:
 * {
 *   success: true,
 *   message: "Project deleted successfully",
 *   code: "PROJECT_DELETED"
 * }
 */
export const formatDeleted = (resourceName = "Resource", deletedData = null, code = null) => {
  return {
    success: true,
    message: `${resourceName} deleted successfully`,
    code: code || `${resourceName.toUpperCase()}_DELETED`,
    ...(deletedData && { data: deletedData }),
  };
};

/**
 * Validation Error Response
 * Use when validation fails
 * @param {array} details - Array of validation errors
 * @returns {object} Formatted validation error response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Validation failed",
 *   code: "VALIDATION_ERROR",
 *   details: [
 *     { field: "email", message: "Email is required" },
 *     { field: "password", message: "Password must be 6+ characters" }
 *   ]
 * }
 */
export const formatValidationError = (details = []) => {
  return {
    success: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    details: Array.isArray(details) ? details : [details],
  };
};

/**
 * Authentication Error Response
 * Use for auth failures
 * @param {string} error - Error message
 * @param {string} code - Auth error code (e.g., "INVALID_TOKEN", "UNAUTHORIZED")
 * @returns {object} Formatted auth error response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Invalid or expired token",
 *   code: "INVALID_TOKEN"
 * }
 */
export const formatAuthError = (error = "Authentication failed", code = "AUTH_ERROR") => {
  return {
    success: false,
    error,
    code,
  };
};

/**
 * Not Found Error Response
 * @param {string} resourceName - Name of resource that wasn't found (e.g., "User", "Project")
 * @returns {object} Formatted not found response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Project not found",
 *   code: "PROJECT_NOT_FOUND"
 * }
 */
export const formatNotFound = (resourceName = "Resource") => {
  return {
    success: false,
    error: `${resourceName} not found`,
    code: `${resourceName.toUpperCase()}_NOT_FOUND`,
  };
};

/**
 * Permission Denied Error Response
 * Use for authorization failures
 * @param {string} message - Custom message or default
 * @returns {object} Formatted permission denied response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "You don't have permission to access this resource",
 *   code: "FORBIDDEN"
 * }
 */
export const formatForbidden = (message = "You don't have permission to access this resource") => {
  return {
    success: false,
    error: message,
    code: "FORBIDDEN",
  };
};

/**
 * Conflict Error Response
 * Use for duplicate/conflict situations
 * @param {string} message - Error message
 * @returns {object} Formatted conflict response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Email already registered",
 *   code: "DUPLICATE_ENTRY"
 * }
 */
export const formatConflict = (message = "This resource already exists") => {
  return {
    success: false,
    error: message,
    code: "CONFLICT",
  };
};

/**
 * Server Error Response
 * Use for unexpected server errors
 * @param {string} message - Error message (don't expose sensitive info)
 * @returns {object} Formatted server error response
 * 
 * Example:
 * {
 *   success: false,
 *   error: "Internal server error",
 *   code: "SERVER_ERROR"
 * }
 */
export const formatServerError = (message = "Internal server error") => {
  return {
    success: false,
    error: message,
    code: "SERVER_ERROR",
  };
};

/**
 * Pagination Helper
 * Calculate pagination info
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination object
 * 
 * Example:
 * const pagination = calculatePagination(2, 10, 50);
 * // { page: 2, limit: 10, total: 50, totalPages: 5 }
 */
export const calculatePagination = (page = 1, limit = 10, total = 0) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, parseInt(limit) || 10);
  const t = Math.max(0, parseInt(total) || 0);

  return {
    page: p,
    limit: l,
    total: t,
    totalPages: Math.ceil(t / l) || 1,
    offset: (p - 1) * l,
  };
};

export default {
  formatSuccess,
  formatError,
  formatList,
  formatCreated,
  formatUpdated,
  formatDeleted,
  formatValidationError,
  formatAuthError,
  formatNotFound,
  formatForbidden,
  formatConflict,
  formatServerError,
  calculatePagination,
};