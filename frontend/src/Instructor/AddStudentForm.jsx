import React, { useState } from "react";
import { addNewStudent } from "../utils/apiHelper";

/**
 * Instructor → Add Student Form
 * Updated to match backend fields: first_name, last_name, email, idToken
 */
export default function AddStudentForm() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    idToken: "", // optional for now (manual creation)
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Only include idToken if it has a value
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      };
      if (formData.idToken.trim()) payload.idToken = formData.idToken.trim();

      const res = await addNewStudent(payload);
      if (res?.success || res?.message?.includes("success")) {
        setMessage("✅ Student added successfully!");
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          idToken: "",
        });
      } else {
        setMessage("⚠️ Unable to add student.");
      }
    } catch (err) {
      console.error("Error adding student:", err);
      setMessage("❌ Something went wrong. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Add Student</h2>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* First Name */}
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            First Name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter student's first name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Last Name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter student's last name"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter student's email"
          />
        </div>

        {/* ID Token (optional for manual add) */}
        <div>
          <label
            htmlFor="idToken"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Firebase ID Token (optional)
          </label>
          <input
            id="idToken"
            name="idToken"
            type="text"
            value={formData.idToken}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            placeholder="Enter Firebase token (if applicable)"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/instructor-dashboard/students")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition"
          >
            {loading ? "Adding..." : "Add Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
