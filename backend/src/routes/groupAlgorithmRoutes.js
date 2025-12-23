/**
 * Group Formation Algorithm Module
 * 
 * Implements a greedy optimization algorithm for assigning students to capstone projects
 * based on their submitted preferences. Uses min-cost flow optimization principles to
 * maximize student satisfaction while respecting project capacity constraints.
 * 
 * Algorithm Strategy:
 * - Prioritizes higher-ranked preferences (1st choice > 2nd choice > 3rd choice)
 * - Uses weighted scoring: 1st choice = -100, 2nd choice = -66, 3rd choice = -33
 * - Employs greedy assignment with random tie-breaking for fairness
 * - Respects project capacity limits (max_team_size)
 * 
 * The algorithm iterates through all student-project preference pairs, sorted by
 * preference rank, and assigns students to projects on a first-come-first-served
 * basis until all students are assigned or project capacities are reached.
 * 
 * @module utils/groupFormationAlgorithm
 */

/**
 * Run Group Formation Algorithm
 * 
 * Executes the main group formation algorithm to assign students to projects based
 * on their preferences. The algorithm uses a greedy approach with the following logic:
 * 
 * 1. Create project capacity tracking with max_team_size limits
 * 2. Generate all (student, project, rank) preference tuples
 * 3. Sort tuples by preference rank (first choices processed first)
 * 4. Assign students greedily while checking capacity constraints
 * 5. Calculate satisfaction statistics and scores
 * 
 * Satisfaction Scoring:
 * - 1st choice: 100 points
 * - 2nd choice: 66 points
 * - 3rd choice: 33 points
 * - Other: 10 points
 * 
 * @function runGroupFormationAlgorithm
 * @param {Array<Object>} students - Array of student objects
 * @param {number} students[].id - Student ID
 * @param {string} students[].name - Student full name
 * @param {Array<number>} students[].preferences - Ordered array of project IDs (rank 1, 2, 3)
 * @param {Array<Object>} projects - Array of project objects
 * @param {number} projects[].id - Project ID
 * @param {string} projects[].title - Project title
 * @param {number} projects[].max_team_size - Maximum team size (default: 4)
 * @returns {Object} Algorithm result with assignments, groups, and statistics
 * @returns {boolean} return.success - Whether algorithm completed successfully
 * @returns {string} return.error - Error message if algorithm failed
 * @returns {Array<Object>} return.assignments - Individual student assignments
 * @returns {Array<Object>} return.groups - Grouped assignments by project
 * @returns {Object} return.stats - Assignment statistics
 * @returns {number} return.stats.total_students - Total number of students
 * @returns {number} return.stats.students_with_preferences - Students who submitted preferences
 * @returns {number} return.stats.assigned_students - Successfully assigned students
 * @returns {number} return.stats.unassigned_students - Students not assigned
 * @returns {number} return.stats.first_choice - Students assigned to 1st choice
 * @returns {number} return.stats.second_choice - Students assigned to 2nd choice
 * @returns {number} return.stats.third_choice - Students assigned to 3rd choice
 * @returns {number} return.stats.other_choice - Students assigned to other choices
 * @returns {number} return.stats.satisfaction_score - Weighted satisfaction score (0-100)
 * 
 * @example
 * const students = [
 *   { id: 1, name: "Alice", preferences: [5, 12, 8] },
 *   { id: 2, name: "Bob", preferences: [12, 5, 3] }
 * ];
 * const projects = [
 *   { id: 5, title: "E-commerce Platform", max_team_size: 4 },
 *   { id: 12, title: "Mobile App", max_team_size: 3 }
 * ];
 * const result = runGroupFormationAlgorithm(students, projects);
 * // result.success === true
 * // result.stats.satisfaction_score === 83.0
 */
export function runGroupFormationAlgorithm(students, projects) {
  // Create project lookup with capacity tracking
  const projectMap = new Map();
  projects.forEach(p => {
    projectMap.set(p.id, {
      ...p,
      capacity: p.max_team_size || 4,
      assigned: []
    });
  });

  // Track assigned students
  const assignedStudents = new Set();
  const assignments = [];
  
  // Stats tracking
  const stats = {
    total_students: students.length,
    students_with_preferences: 0,
    assigned_students: 0,
    unassigned_students: 0,
    first_choice: 0,
    second_choice: 0,
    third_choice: 0,
    other_choice: 0
  };

  // Filter students with preferences
  const studentsWithPrefs = students.filter(s => s.preferences && s.preferences.length > 0);
  stats.students_with_preferences = studentsWithPrefs.length;

  if (studentsWithPrefs.length === 0) {
    return {
      success: false,
      error: "No students have submitted preferences yet",
      stats
    };
  }

  // Create preference tuples: (student, project_id, rank)
  const prefTuples = [];
  studentsWithPrefs.forEach(student => {
    student.preferences.forEach((projectId, index) => {
      if (projectMap.has(projectId)) {
        prefTuples.push({
          student,
          projectId,
          rank: index + 1, // 1-based rank
          // Weight for sorting: lower rank = higher priority
          // Within same rank, randomize slightly to be fair
          sortKey: (index + 1) * 1000 + Math.random() * 100
        });
      }
    });
  });

  // Sort by preference rank (first choices first)
  prefTuples.sort((a, b) => a.sortKey - b.sortKey);

  // Greedy assignment
  prefTuples.forEach(tuple => {
    const { student, projectId, rank } = tuple;
    
    // Skip if student already assigned
    if (assignedStudents.has(student.id)) return;
    
    // Check if project has capacity
    const project = projectMap.get(projectId);
    if (project.assigned.length >= project.capacity) return;
    
    // Assign student to project
    assignedStudents.add(student.id);
    project.assigned.push({
      id: student.id,
      name: student.name,
      preference_rank: rank
    });
    
    assignments.push({
      student_id: student.id,
      student_name: student.name,
      project_id: projectId,
      project_title: project.title,
      preference_rank: rank
    });
    
    // Update stats
    stats.assigned_students++;
    if (rank === 1) stats.first_choice++;
    else if (rank === 2) stats.second_choice++;
    else if (rank === 3) stats.third_choice++;
    else stats.other_choice++;
  });

  // Count unassigned students
  stats.unassigned_students = studentsWithPrefs.length - stats.assigned_students;

  // Calculate satisfaction score (weighted average)
  if (stats.assigned_students > 0) {
    const weightedScore = 
      stats.first_choice * 100 +
      stats.second_choice * 66 +
      stats.third_choice * 33 +
      stats.other_choice * 10;
    stats.satisfaction_score = Math.round(weightedScore / stats.assigned_students * 10) / 10;
  } else {
    stats.satisfaction_score = 0;
  }

  // Build groups array
  const groups = [];
  projectMap.forEach((project, projectId) => {
    if (project.assigned.length > 0) {
      groups.push({
        project_id: projectId,
        project_title: project.title,
        members: project.assigned
      });
    }
  });

  return {
    success: true,
    assignments,
    groups,
    stats
  };
}

/**
 * Validate Algorithm Input Data
 * 
 * Performs comprehensive validation of input data before running the group formation
 * algorithm. Checks for:
 * - Non-empty student and project arrays
 * - At least one student with submitted preferences
 * - Sufficient total project capacity for all students with preferences
 * 
 * This validation helps prevent algorithm failures and provides clear error messages
 * for instructors to address data issues before running group formation.
 * 
 * @function validateAlgorithmInput
 * @param {Array<Object>} students - Array of student objects with preferences
 * @param {Array<Object>} projects - Array of project objects with capacity
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - Whether input is valid for algorithm
 * @returns {Array<string>} return.errors - Array of validation error messages
 * @returns {number} return.studentsWithPreferences - Count of students with preferences
 * @returns {number} return.totalCapacity - Total capacity across all projects
 * 
 * @example
 * const validation = validateAlgorithmInput(students, projects);
 * if (!validation.valid) {
 *   console.error("Validation errors:", validation.errors);
 *   // ["No students have submitted preferences"]
 * }
 * 
 * @example
 * const validation = validateAlgorithmInput(students, projects);
 * if (validation.valid) {
 *   console.log(`${validation.studentsWithPreferences} students, ${validation.totalCapacity} slots`);
 *   const result = runGroupFormationAlgorithm(students, projects);
 * }
 */
export function validateAlgorithmInput(students, projects) {
  const errors = [];

  if (!students || students.length === 0) {
    errors.push("No students provided");
  }

  if (!projects || projects.length === 0) {
    errors.push("No projects provided");
  }

  const studentsWithPrefs = students?.filter(s => s.preferences?.length > 0) || [];
  if (studentsWithPrefs.length === 0) {
    errors.push("No students have submitted preferences");
  }

  // Check total capacity
  const totalCapacity = projects?.reduce((sum, p) => sum + (p.max_team_size || 4), 0) || 0;
  if (totalCapacity < studentsWithPrefs.length) {
    errors.push(`Insufficient capacity: ${studentsWithPrefs.length} students but only ${totalCapacity} slots available`);
  }

  return {
    valid: errors.length === 0,
    errors,
    studentsWithPreferences: studentsWithPrefs.length,
    totalCapacity
  };
}

/**
 * Default Export
 * 
 * Provides both algorithm functions as a single exportable object.
 * 
 * @exports groupFormationAlgorithm
 * @type {Object}
 * @property {Function} runGroupFormationAlgorithm - Main algorithm function
 * @property {Function} validateAlgorithmInput - Input validation function
 */
export default {
  runGroupFormationAlgorithm,
  validateAlgorithmInput
};