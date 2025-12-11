import React, { useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Instructor → Add Student Form
 * Simplified flow: Just name + email
 * Backend generates temporary password for the student
 */
export default function AddStudentForm() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // {success, message, tempPassword}
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      };

      const res = await apiCall("/instructors/add-student", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        setResult({
          success: true,
          message: "Student added successfully!",
          tempPassword: res.tempPassword,
          email: formData.email,
        });
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
        });
      } else {
        setResult({
          success: false,
          message: res?.error || "Unable to add student.",
        });
      }
    } catch (err) {
      console.error("Error adding student:", err);
      setResult({
        success: false,
        message: err.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Email: ${result.email}\nTemporary Password: ${result.tempPassword}\n\nPlease login at: ${window.location.origin}/login and change your password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addAnother = () => {
    setResult(null);
    setCopied(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Add Student</h2>
      <p className="text-sm text-slate-500 mb-6">
        Add a new student to the course. A temporary password will be generated for them.
      </p>

      {/* Success Result with Credentials */}
      {result?.success && result.tempPassword && (
        <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-green-700">Student Added Successfully!</span>
          </div>

          <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
            <p className="text-sm text-slate-600 mb-3">Share these credentials with the student:</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                <span className="text-sm text-slate-500">Email:</span>
                <span className="font-mono text-sm text-slate-800">{result.email}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                <span className="text-sm text-slate-500">Temporary Password:</span>
                <span className="font-mono text-sm text-slate-800 font-semibold">{result.tempPassword}</span>
              </div>
            </div>

            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              The student should change this password after first login.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyCredentials}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Credentials
                </>
              )}
            </button>

            <button
              onClick={addAnother}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Add Another Student
            </button>

            <button
              onClick={() => window.location.href = "/instructor-dashboard/students"}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Students
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {result && !result.success && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {result.message}
        </div>
      )}

      {/* Form - Hide when showing success */}
      {!result?.success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="Enter student's first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="Enter student's last name"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              placeholder="Enter student's email"
            />
            <p className="mt-1 text-xs text-slate-500">
              The student will use this email to login
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.location.href = "/instructor-dashboard/students"}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add Student"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}