import jwt from "jsonwebtoken";

/**
 * Authentication Middleware Module
 * 
 * Provides JWT token verification and role-based access control middleware
 * for protecting API routes. Implements ownership verification to ensure users
 * can only access their own resources.
 * 
 * Middleware Chain Order:
 * 1. verifyToken - Always first to authenticate the user
 * 2. verifyRole/verifyOwnership - Check permissions
 * 3. Route handler - Process the request
 * 
 * @module middleware/authMiddleware
 * @requires jsonwebtoken
 */

/**
 * Verify JWT Token Middleware
 * 
 * Authenticates requests by validating JWT tokens in the Authorization header.
 * Extracts and decodes user information from the token and attaches it to req.user
 * for use in subsequent middleware and route handlers.
 * 
 * Token Format: "Bearer <JWT_TOKEN>"
 * 
 * Sets req.user with decoded token data:
 * - uid: Firebase user ID
 * - email: User email address
 * - role: User role (client, student, instructor)
 * - clientId: Numeric client ID (if role is client)
 * - studentId: Numeric student ID (if role is student)
 * - instructorId: Numeric instructor ID (if role is instructor)
 * 
 * @function verifyToken
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Protect a route with authentication
 * router.get('/profile', verifyToken, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * 
 * @example
 * // Client request with token
 * fetch('/api/profile', {
 *   headers: {
 *     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *   }
 * });
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided. Please include Authorization header with Bearer token.",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Attach user info to request object
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      clientId: decoded.clientId || null,
      studentId: decoded.studentId || null,
      instructorId: decoded.instructorId || null,
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);

    // Handle specific JWT errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    res.status(401).json({
      success: false,
      error: "Token verification failed",
    });
  }
};

/**
 * Verify User Role Middleware Factory
 * 
 * Creates middleware that checks if the authenticated user has one of the allowed roles.
 * Returns a 403 Forbidden error if the user's role is not in the allowed list.
 * Must be used after verifyToken middleware.
 * 
 * @function verifyRole
 * @param {Array<string>} allowedRoles - Array of allowed roles (e.g., ["client", "admin"])
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Allow only clients and admins
 * router.post('/projects', 
 *   verifyToken, 
 *   verifyRole(['client', 'admin']), 
 *   createProject
 * );
 * 
 * @example
 * // Single role restriction
 * router.get('/admin/dashboard', 
 *   verifyToken, 
 *   verifyRole(['admin']), 
 *   getAdminDashboard
 * );
 * 
 * @example
 * // Multiple roles allowed
 * router.get('/projects', 
 *   verifyToken, 
 *   verifyRole(['student', 'instructor', 'client']), 
 *   getAllProjects
 * );
 */
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
          code: "FORBIDDEN",
        });
      }

      next();
    } catch (err) {
      console.error("Role verification error:", err);
      res.status(500).json({
        success: false,
        error: "Role verification failed",
      });
    }
  };
};

/**
 * Verify Client Ownership Middleware
 * 
 * Ensures that clients can only access their own resources by comparing
 * the client ID from the route parameter with the client ID from the JWT token.
 * Prevents unauthorized access to other clients' data.
 * 
 * Must be used after verifyToken middleware.
 * Requires :client_id parameter in the route path.
 * 
 * @function verifyClientOwnership
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.client_id - Client ID from URL parameter
 * @param {Object} req.user - User object attached by verifyToken
 * @param {number} req.user.clientId - Client ID from JWT token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Protect client-specific routes
 * router.get('/clients/:client_id/projects', 
 *   verifyToken, 
 *   verifyClientOwnership, 
 *   getClientProjects
 * );
 * 
 * @example
 * // Update client profile
 * router.put('/clients/:client_id/profile', 
 *   verifyToken, 
 *   verifyClientOwnership, 
 *   updateClientProfile
 * );
 */
export const verifyClientOwnership = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Clients only",
      });
    }

    const clientIdFromParam = parseInt(req.params.client_id);
    const clientIdFromToken = req.user.clientId;

    if (clientIdFromParam !== clientIdFromToken) {
      return res.status(403).json({
        success: false,
        error: "You can only access your own resources",
        code: "FORBIDDEN",
      });
    }

    next();
  } catch (err) {
    console.error("Ownership verification error:", err);
    res.status(500).json({
      success: false,
      error: "Ownership verification failed",
    });
  }
};

/**
 * Verify Student Ownership Middleware
 * 
 * Ensures that students can only access their own resources by comparing
 * the student ID from the route parameter with the student ID from the JWT token.
 * Prevents unauthorized access to other students' data.
 * 
 * Must be used after verifyToken middleware.
 * Requires :student_id parameter in the route path.
 * 
 * @function verifyStudentOwnership
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.student_id - Student ID from URL parameter
 * @param {Object} req.user - User object attached by verifyToken
 * @param {number} req.user.studentId - Student ID from JWT token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Protect student-specific routes
 * router.get('/students/:student_id/preferences', 
 *   verifyToken, 
 *   verifyStudentOwnership, 
 *   getStudentPreferences
 * );
 * 
 * @example
 * // Submit student preferences
 * router.post('/students/:student_id/preferences', 
 *   verifyToken, 
 *   verifyStudentOwnership, 
 *   submitPreferences
 * );
 */
export const verifyStudentOwnership = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        error: "Students only",
      });
    }

    const studentIdFromParam = parseInt(req.params.student_id);
    const studentIdFromToken = req.user.studentId;

    if (studentIdFromParam !== studentIdFromToken) {
      return res.status(403).json({
        success: false,
        error: "You can only access your own resources",
        code: "FORBIDDEN",
      });
    }

    next();
  } catch (err) {
    console.error("Ownership verification error:", err);
    res.status(500).json({
      success: false,
      error: "Ownership verification failed",
    });
  }
};

/**
 * Verify Instructor Ownership Middleware
 * 
 * Ensures that instructors can only access their own resources by comparing
 * the instructor ID from the route parameter with the instructor ID from the JWT token.
 * Prevents unauthorized access to other instructors' data.
 * 
 * Must be used after verifyToken middleware.
 * Requires :instructor_id parameter in the route path.
 * 
 * @function verifyInstructorOwnership
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.instructor_id - Instructor ID from URL parameter
 * @param {Object} req.user - User object attached by verifyToken
 * @param {number} req.user.instructorId - Instructor ID from JWT token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Protect instructor-specific routes
 * router.get('/instructors/:instructor_id/courses', 
 *   verifyToken, 
 *   verifyInstructorOwnership, 
 *   getInstructorCourses
 * );
 * 
 * @example
 * // Update instructor profile
 * router.put('/instructors/:instructor_id/profile', 
 *   verifyToken, 
 *   verifyInstructorOwnership, 
 *   updateInstructorProfile
 * );
 */
export const verifyInstructorOwnership = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        error: "Instructors only",
      });
    }

    const instructorIdFromParam = parseInt(req.params.instructor_id);
    const instructorIdFromToken = req.user.instructorId;

    if (instructorIdFromParam !== instructorIdFromToken) {
      return res.status(403).json({
        success: false,
        error: "You can only access your own resources",
        code: "FORBIDDEN",
      });
    }

    next();
  } catch (err) {
    console.error("Ownership verification error:", err);
    res.status(500).json({
      success: false,
      error: "Ownership verification failed",
    });
  }
};

/**
 * Verify Client-Only Access Middleware
 * 
 * Restricts route access to only users with the "client" role.
 * Returns 403 Forbidden if the authenticated user is not a client.
 * 
 * Must be used after verifyToken middleware.
 * 
 * @function verifyClientOnly
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object attached by verifyToken
 * @param {string} req.user.role - User's role
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Create project (clients only)
 * router.post('/projects', 
 *   verifyToken, 
 *   verifyClientOnly, 
 *   createProject
 * );
 * 
 * @example
 * // View client dashboard
 * router.get('/client/dashboard', 
 *   verifyToken, 
 *   verifyClientOnly, 
 *   getClientDashboard
 * );
 */
export const verifyClientOnly = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "This action is only available to clients",
        code: "CLIENT_ONLY",
      });
    }

    next();
  } catch (err) {
    console.error("Client verification error:", err);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
};

/**
 * Verify Student-Only Access Middleware
 * 
 * Restricts route access to only users with the "student" role.
 * Returns 403 Forbidden if the authenticated user is not a student.
 * 
 * Must be used after verifyToken middleware.
 * 
 * @function verifyStudentOnly
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object attached by verifyToken
 * @param {string} req.user.role - User's role
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Submit preferences (students only)
 * router.post('/preferences', 
 *   verifyToken, 
 *   verifyStudentOnly, 
 *   submitPreferences
 * );
 * 
 * @example
 * // View student dashboard
 * router.get('/student/dashboard', 
 *   verifyToken, 
 *   verifyStudentOnly, 
 *   getStudentDashboard
 * );
 */
export const verifyStudentOnly = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        error: "This action is only available to students",
        code: "STUDENT_ONLY",
      });
    }

    next();
  } catch (err) {
    console.error("Student verification error:", err);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
};

/**
 * Verify Instructor-Only Access Middleware
 * 
 * Restricts route access to only users with the "instructor" role.
 * Returns 403 Forbidden if the authenticated user is not an instructor.
 * 
 * Must be used after verifyToken middleware.
 * 
 * @function verifyInstructorOnly
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object attached by verifyToken
 * @param {string} req.user.role - User's role
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Approve projects (instructors only)
 * router.post('/projects/:id/approve', 
 *   verifyToken, 
 *   verifyInstructorOnly, 
 *   approveProject
 * );
 * 
 * @example
 * // View instructor dashboard
 * router.get('/instructor/dashboard', 
 *   verifyToken, 
 *   verifyInstructorOnly, 
 *   getInstructorDashboard
 * );
 * 
 * @example
 * // Create groups (instructors only)
 * router.post('/groups', 
 *   verifyToken, 
 *   verifyInstructorOnly, 
 *   createGroup
 * );
 */
export const verifyInstructorOnly = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        error: "This action is only available to instructors",
        code: "INSTRUCTOR_ONLY",
      });
    }

    next();
  } catch (err) {
    console.error("Instructor verification error:", err);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
};

export default verifyToken;