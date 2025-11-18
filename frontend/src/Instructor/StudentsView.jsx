import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstructorStudents } from "../utils/apiHelper";

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

          {/* Add Student Button - ✅ Fixed to use navigate */}
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
                      onClick={() => alert(`Viewing ${student.name}`)}
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
    </div>
  );
}
