import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstructorStudents, apiCall } from "../utils/apiHelper";

/**
 * Instructor → Students Page
 * Displays all students with search + add student button.
 */
export default function StudentsView({ instructorId }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!instructorId) {
        console.error("No instructor ID provided");
        setLoading(false);
        return;
      }

      try {
        const res = await getInstructorStudents(instructorId);
        const data = res.data || [];
        
        // Map backend response to include full name
        const studentsWithFullName = data.map(student => ({
          ...student,
          name: `${student.first_name} ${student.last_name}`,
          status: student.status || "Active" // Default to Active if not provided
        }));
        
        setStudents(studentsWithFullName);
        setFilteredStudents(studentsWithFullName);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [instructorId]);

  // Search filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredStudents(
      students.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.first_name?.toLowerCase().includes(term) ||
          s.last_name?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, students]);

  // Fetch student details when modal opens
  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    
    try {
      // Fetch student's group info
      const groupRes = await apiCall(`/students/${student.id}/group`, { method: "GET" });
      
      // Fetch student's preferences
      const prefsRes = await apiCall(`/students/${student.id}/preferences`, { method: "GET" });
      
      setStudentDetails({
        group: groupRes?.data || null,
        preferences: prefsRes?.data || []
      });
    } catch (error) {
      console.error("Error fetching student details:", error);
      setStudentDetails({ group: null, preferences: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Students</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>

          {/* Add Student Button */}
          <button
            onClick={() => navigate("/instructor-dashboard/add-student")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {student.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{student.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      onClick={() => handleViewStudent(student)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-slate-500 text-sm"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Student Details
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedStudent.name}</p>
                    <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedStudent.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {loadingDetails && (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Loading details...</p>
                </div>
              )}

              {/* Group Assignment */}
              {!loadingDetails && studentDetails && (
                <>
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-medium text-slate-700 mb-2">Group Assignment</h4>
                    {studentDetails.group ? (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="font-medium text-slate-800">{studentDetails.group.title}</p>
                        <p className="text-sm text-slate-600">
                          Group #{studentDetails.group.group_number}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Not assigned to a group yet</p>
                    )}
                  </div>

                  {/* Preferences */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-medium text-slate-700 mb-2">Project Preferences</h4>
                    {studentDetails.preferences && studentDetails.preferences.length > 0 ? (
                      <ol className="space-y-2">
                        {studentDetails.preferences.map((pref, index) => (
                          <li key={pref.project_id || index} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                              {pref.rank || index + 1}
                            </span>
                            <span className="text-sm text-slate-700">{pref.project_title || pref.title || `Project #${pref.project_id}`}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No preferences submitted yet</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}