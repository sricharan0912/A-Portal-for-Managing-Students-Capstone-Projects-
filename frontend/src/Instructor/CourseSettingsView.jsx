import { useState, useEffect } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * CourseSettingsView Component
 * Allows instructors to manage course settings like preference deadlines
 */
export default function CourseSettingsView() {
  const [settings, setSettings] = useState({
    preference_deadline: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await apiCall(
          "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/instructors/settings/all",
          { method: "GET" }
        );

        if (data.data) {
          setSettings(data.data);

          // Parse existing deadline into date and time
          if (data.data.preference_deadline?.value) {
            const deadline = new Date(data.data.preference_deadline.value);
            setDeadlineDate(deadline.toISOString().split("T")[0]);
            setDeadlineTime(
              deadline.toTimeString().slice(0, 5)
            );
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle deadline save
  const handleSaveDeadline = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Combine date and time
      let deadlineValue = null;
      if (deadlineDate) {
        deadlineValue = `${deadlineDate}T${deadlineTime}:00`;
      }

      await apiCall(
        "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/instructors/settings/preference_deadline",
        {
          method: "PUT",
          body: JSON.stringify({ value: deadlineValue }),
        }
      );

      setSuccess("Deadline saved successfully!");
      
      // Update local settings
      setSettings((prev) => ({
        ...prev,
        preference_deadline: {
          ...prev.preference_deadline,
          value: deadlineValue,
          updated_at: new Date().toISOString(),
        },
      }));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving deadline:", err);
      setError("Failed to save deadline");
    } finally {
      setSaving(false);
    }
  };

  // Handle clear deadline
  const handleClearDeadline = async () => {
    if (!confirm("Are you sure you want to remove the deadline? Students will be able to submit preferences at any time.")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiCall(
        "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app/instructors/settings/preference_deadline",
        {
          method: "PUT",
          body: JSON.stringify({ value: null }),
        }
      );

      setDeadlineDate("");
      setDeadlineTime("23:59");
      setSettings((prev) => ({
        ...prev,
        preference_deadline: {
          ...prev.preference_deadline,
          value: null,
          updated_at: new Date().toISOString(),
        },
      }));

      setSuccess("Deadline removed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error clearing deadline:", err);
      setError("Failed to clear deadline");
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if deadline is in the past
  const isDeadlinePassed = () => {
    if (!settings.preference_deadline?.value) return false;
    return new Date(settings.preference_deadline.value) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800">Course Settings</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage course-wide settings and deadlines
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <svg
            className="h-5 w-5 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <svg
            className="h-5 w-5 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Preference Deadline Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Preference Submission Deadline
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Set a deadline for students to submit their project preferences
            </p>
          </div>
          {settings.preference_deadline?.value && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isDeadlinePassed()
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isDeadlinePassed() ? "bg-red-500" : "bg-green-500"
                }`}
              />
              {isDeadlinePassed() ? "Deadline Passed" : "Active"}
            </span>
          )}
        </div>

        {/* Current Deadline Display */}
        <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Current Deadline</p>
          <p className="text-lg font-semibold text-slate-800">
            {formatDateTime(settings.preference_deadline?.value)}
          </p>
          {settings.preference_deadline?.updated_at && (
            <p className="text-xs text-slate-400 mt-2">
              Last updated: {formatDateTime(settings.preference_deadline.updated_at)}
            </p>
          )}
        </div>

        {/* Date/Time Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDeadline}
            disabled={saving || !deadlineDate}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Deadline"}
          </button>
          {settings.preference_deadline?.value && (
            <button
              onClick={handleClearDeadline}
              disabled={saving}
              className="rounded-lg border-2 border-red-300 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove Deadline
            </button>
          )}
        </div>
      </section>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800">How it works</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Students will see a countdown to the deadline on their preferences page</li>
              <li>• After the deadline, students cannot submit or modify preferences</li>
              <li>• Students who already submitted can update until the deadline</li>
              <li>• Remove the deadline to allow submissions at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
