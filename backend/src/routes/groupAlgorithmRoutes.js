/**
 * Group Formation Algorithm
 * Uses a greedy approach to assign students to projects based on preferences
 * 
 * Based on min-cost flow optimization principles:
 * - 1st choice = highest priority (cost -100)
 * - 2nd choice = medium priority (cost -66)
 * - 3rd choice = lower priority (cost -33)
 */

/**
 * Run the group formation algorithm
 * @param {Array} students - Array of {id, name, preferences: [projectId1, projectId2, ...]}
 * @param {Array} projects - Array of {id, title, max_team_size}
 * @returns {Object} Result with assignments, groups, and statistics
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
 * Validate input data before running algorithm
 * @param {Array} students 
 * @param {Array} projects 
 * @returns {Object} Validation result
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

export default {
  runGroupFormationAlgorithm,
  validateAlgorithmInput
};