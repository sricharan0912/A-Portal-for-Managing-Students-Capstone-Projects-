import jwt from "jsonwebtoken";

/**
 * Verify JWT Token Middleware
 * Checks for valid JWT token in Authorization header
 * Attaches decoded user info to req.user
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
 * Verify User Role Middleware
 * Checks if authenticated user has one of the allowed roles
 * Must be used after verifyToken middleware
 * 
 * @param {array} allowedRoles - Array of allowed roles (e.g., ["client", "admin"])
 * @returns {function} Middleware function
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
 * Ensures a client can only access their own resources
 * Must be used after verifyToken middleware
 * 
 * Usage: router.get("/:client_id", verifyToken, verifyClientOwnership, handler)
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
 * Ensures a student can only access their own resources
 * Must be used after verifyToken middleware
 * 
 * Usage: router.get("/:student_id", verifyToken, verifyStudentOwnership, handler)
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
 * Ensures an instructor can only access their own resources
 * Must be used after verifyToken middleware
 * 
 * Usage: router.get("/:instructor_id", verifyToken, verifyInstructorOwnership, handler)
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
 * Ensures only clients can access the route
 * Must be used after verifyToken middleware
 * 
 * Usage: router.post("/", verifyToken, verifyClientOnly, handler)
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
 * Ensures only students can access the route
 * Must be used after verifyToken middleware
 * 
 * Usage: router.post("/", verifyToken, verifyStudentOnly, handler)
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
 * Ensures only instructors can access the route
 * Must be used after verifyToken middleware
 * 
 * Usage: router.post("/", verifyToken, verifyInstructorOnly, handler)
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