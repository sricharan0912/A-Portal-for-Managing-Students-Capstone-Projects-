/**
 * Request Validation Middleware
 * Validates incoming request data before it reaches route handlers
 * Removes repetitive if-checks from every route
 * 
 * Usage in routes:
 * router.post("/signup", validateStudentSignup, handler);
 * router.post("/login", validateLogin, handler);
 */

/**
 * Validate Client Signup
 * Checks: email, idToken, name, organization_name
 */
export const validateClientSignup = (req, res, next) => {
  const { email, idToken, name, organization_name, website } = req.body;

  const errors = [];

  // Email validation
  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required and must be a string" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  // ID Token validation
  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "Firebase ID token is required" });
  }

  // Name validation
  if (!name || typeof name !== "string") {
    errors.push({ field: "name", message: "Name is required and must be a string" });
  } else if (name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  // Organization name validation
  if (!organization_name || typeof organization_name !== "string") {
    errors.push({ field: "organization_name", message: "Organization name is required" });
  } else if (organization_name.trim().length < 2) {
    errors.push({ field: "organization_name", message: "Organization name must be at least 2 characters" });
  }

  // Website validation (optional)
  if (website && typeof website === "string" && !isValidUrl(website)) {
    errors.push({ field: "website", message: "Website URL format is invalid" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Client Login
 * Checks: email, idToken
 */
export const validateClientLogin = (req, res, next) => {
  const { email, idToken } = req.body;

  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "ID token is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Student Signup
 * Checks: email, idToken, first_name, last_name
 */
export const validateStudentSignup = (req, res, next) => {
  const { email, idToken, first_name, last_name } = req.body;

  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "Firebase ID token is required" });
  }

  if (!first_name || typeof first_name !== "string") {
    errors.push({ field: "first_name", message: "First name is required" });
  } else if (first_name.trim().length < 2) {
    errors.push({ field: "first_name", message: "First name must be at least 2 characters" });
  }

  if (!last_name || typeof last_name !== "string") {
    errors.push({ field: "last_name", message: "Last name is required" });
  } else if (last_name.trim().length < 2) {
    errors.push({ field: "last_name", message: "Last name must be at least 2 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Student Login
 * Checks: email, idToken
 */
export const validateStudentLogin = (req, res, next) => {
  const { email, idToken } = req.body;

  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "ID token is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Instructor Signup
 * Checks: email, idToken, first_name, last_name
 * NOTE: Frontend creates Firebase user and sends idToken, backend only verifies it
 */
export const validateInstructorSignup = (req, res, next) => {
  const { email, idToken, first_name, last_name } = req.body;

  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "Firebase ID token is required" });
  }

  if (!first_name || typeof first_name !== "string") {
    errors.push({ field: "first_name", message: "First name is required" });
  } else if (first_name.trim().length < 2) {
    errors.push({ field: "first_name", message: "First name must be at least 2 characters" });
  }

  if (!last_name || typeof last_name !== "string") {
    errors.push({ field: "last_name", message: "Last name is required" });
  } else if (last_name.trim().length < 2) {
    errors.push({ field: "last_name", message: "Last name must be at least 2 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Instructor Login
 * Checks: email, idToken
 */
export const validateInstructorLogin = (req, res, next) => {
  const { email, idToken } = req.body;

  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  if (!idToken || typeof idToken !== "string") {
    errors.push({ field: "idToken", message: "ID token is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Project Creation/Update
 * Checks: title, description, skills_required
 */
export const validateProject = (req, res, next) => {
  const { title, description, skills_required, category, team_size, complexity_level } = req.body;

  const errors = [];

  if (!title || typeof title !== "string") {
    errors.push({ field: "title", message: "Title is required and must be a string" });
  } else if (title.trim().length < 5) {
    errors.push({ field: "title", message: "Title must be at least 5 characters" });
  }

  if (!description || typeof description !== "string") {
    errors.push({ field: "description", message: "Description is required and must be a string" });
  } else if (description.trim().length < 20) {
    errors.push({ field: "description", message: "Description must be at least 20 characters" });
  }

  if (!skills_required || typeof skills_required !== "string") {
    errors.push({ field: "skills_required", message: "Skills required is required" });
  } else if (skills_required.trim().length < 3) {
    errors.push({ field: "skills_required", message: "Skills required must be at least 3 characters" });
  }

  // Optional validations
  if (team_size) {
    if (typeof team_size !== "number" && typeof team_size !== "string") {
      errors.push({ field: "team_size", message: "Team size must be a number" });
    } else {
      const size = parseInt(team_size);
      if (isNaN(size) || size < 1 || size > 50) {
        errors.push({ field: "team_size", message: "Team size must be between 1 and 50" });
      }
    }
  }

  if (complexity_level && !["Beginner", "Intermediate", "Advanced"].includes(complexity_level)) {
    errors.push({ 
      field: "complexity_level", 
      message: "Complexity level must be Beginner, Intermediate, or Advanced" 
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Student Preferences Submission
 * Checks: preferences array with project_id and preference_rank
 */
export const validatePreferences = (req, res, next) => {
  const { preferences } = req.body;

  const errors = [];

  if (!Array.isArray(preferences)) {
    errors.push({ field: "preferences", message: "Preferences must be an array" });
  } else {
    if (preferences.length === 0) {
      errors.push({ field: "preferences", message: "At least one preference is required" });
    }

    if (preferences.length > 3) {
      errors.push({ field: "preferences", message: "Maximum 3 preferences allowed" });
    }

    preferences.forEach((pref, index) => {
      if (!pref.project_id || typeof pref.project_id !== "number") {
        errors.push({ 
          field: `preferences[${index}].project_id`, 
          message: "project_id is required and must be a number" 
        });
      }

      if (!pref.preference_rank || typeof pref.preference_rank !== "number") {
        errors.push({ 
          field: `preferences[${index}].preference_rank`, 
          message: "preference_rank is required and must be a number" 
        });
      } else if (pref.preference_rank < 1 || pref.preference_rank > 3) {
        errors.push({ 
          field: `preferences[${index}].preference_rank`, 
          message: "preference_rank must be 1, 2, or 3" 
        });
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

/**
 * Validate Group Assignment
 * Checks: assignments array with project_id and student_ids
 */
export const validateGroupAssignment = (req, res, next) => {
  const { assignments } = req.body;

  const errors = [];

  if (!Array.isArray(assignments)) {
    errors.push({ field: "assignments", message: "Assignments must be an array" });
  } else {
    if (assignments.length === 0) {
      errors.push({ field: "assignments", message: "At least one assignment is required" });
    }

    assignments.forEach((assignment, index) => {
      if (!assignment.project_id || typeof assignment.project_id !== "number") {
        errors.push({ 
          field: `assignments[${index}].project_id`, 
          message: "project_id is required and must be a number" 
        });
      }

      if (!Array.isArray(assignment.student_ids)) {
        errors.push({ 
          field: `assignments[${index}].student_ids`, 
          message: "student_ids must be an array" 
        });
      } else if (assignment.student_ids.length === 0) {
        errors.push({ 
          field: `assignments[${index}].student_ids`, 
          message: "At least one student must be assigned" 
        });
      } else {
        assignment.student_ids.forEach((studentId, subIndex) => {
          if (typeof studentId !== "number") {
            errors.push({ 
              field: `assignments[${index}].student_ids[${subIndex}]`, 
              message: "Student ID must be a number" 
            });
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    });
  }

  next();
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url
 * @returns {boolean}
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export default {
  validateClientSignup,
  validateClientLogin,
  validateStudentSignup,
  validateStudentLogin,
  validateInstructorSignup,
  validateInstructorLogin,
  validateProject,
  validatePreferences,
  validateGroupAssignment,
};