import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

// Icon components for section headers
const ClipboardIcon = () => (
  <svg className="inline-block w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const GearIcon = () => (
  <svg className="inline-block w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="inline-block w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="inline-block w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default function ProjectFormModal({
  clientId,
  projectData,
  onSave,
  onClose,
  onProjectCreated,
}) {
  const isEditing = !!projectData;

  const [title, setTitle] = useState(projectData?.title || "");
  const [description, setDescription] = useState(projectData?.description || "");
  const [skills, setSkills] = useState(String(projectData?.skills_required || ""));
  const [category, setCategory] = useState(projectData?.category || "");
  const [teamSize, setTeamSize] = useState(projectData?.team_size || "");
  const [startDate, setStartDate] = useState(toInputDate(projectData?.start_date) || "");
  const [endDate, setEndDate] = useState(toInputDate(projectData?.end_date) || "");
  const [complexityLevel, setComplexityLevel] = useState(projectData?.complexity_level || "");
  const [deliverables, setDeliverables] = useState(projectData?.deliverables || "");
  const [projectLocation, setProjectLocation] = useState(projectData?.project_location || "");
  const [industry, setIndustry] = useState(projectData?.industry || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectData) return;
    setTitle(projectData.title || "");
    setDescription(projectData.description || "");
    setSkills(String(projectData.skills_required || ""));
    setCategory(projectData.category || "");
    setTeamSize(projectData.team_size || "");
    setStartDate(toInputDate(projectData.start_date) || "");
    setEndDate(toInputDate(projectData.end_date) || "");
    setComplexityLevel(projectData.complexity_level || "");
    setDeliverables(projectData.deliverables || "");
    setProjectLocation(projectData.project_location || "");
    setIndustry(projectData.industry || "");
  }, [projectData]);

  function toInputDate(d) {
    if (!d) return "";
    // if already YYYY-MM-DD
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function normalizeDate(v) {
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return toInputDate(v) || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Ensure skills is a string before calling trim()
    const skillsStr = String(skills || "");
    
    if (!title.trim() || !description.trim() || !skillsStr.trim()) {
      setError("Project title, description and skills are required.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      skills_required: skillsStr.trim(),
      category: category || null,
      team_size: teamSize ? parseInt(teamSize, 10) : null,
      start_date: normalizeDate(startDate),
      end_date: normalizeDate(endDate),
      complexity_level: complexityLevel || null,
      deliverables: deliverables || null,
      project_location: projectLocation || null,
      industry: industry || null,
      ...(isEditing ? { status: projectData.status } : { status: "open" }),
      // client_id not required if backend reads from token; include only if your API needs it:
      ...(clientId && !isEditing ? { client_id: clientId } : {}),
    };

    console.log("📤 Submitting payload:", payload);

    setLoading(true);
    try {
      let result;
      if (isEditing) {
        result = await apiCall(`${API_BASE_URL}/projects/${projectData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiCall(`${API_BASE_URL}/projects`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      console.log("📥 API Response:", result);

      // ✅ Extract the actual project data from the API response
      // Backend returns: { success: true, data: { id, title, ... }, message: "..." }
      const projectFromApi = result?.data || result;
      
      // Build complete project object with all fields
      const updated = {
        // Start with the payload (form data)
        ...payload,
        // Override with API response data (includes id, slug, created_at, etc.)
        ...projectFromApi,
        // Ensure we have critical fields
        id: projectFromApi.id || projectData?.id || Date.now(),
        status: projectFromApi.status || payload.status || "open",
        created_at: projectFromApi.created_at || new Date().toISOString(),
      };

      console.log("✅ Final project object:", updated);

      // Call the appropriate callbacks
      if (!isEditing && onProjectCreated) {
        console.log("🎉 Calling onProjectCreated");
        onProjectCreated(updated);
      }
      
      onSave(updated);
      onClose();
    } catch (err) {
      console.error("❌ Error saving project:", err);
      setError(err?.message || "Failed to save project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-enter rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {isEditing ? "Edit Project" : "Create New Project"}
          </h2>
          <p className="mt-2 text-slate-600">
            {isEditing
              ? "Update your project details"
              : "Provide detailed information about your project so students can understand your requirements."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close form"
          type="button"
        >
          <svg
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <ClipboardIcon />
              Basic Information
            </h3>
            <p className="mt-1 text-sm text-slate-500 ml-7">Essential details about your project</p>
          </div>

          <div>
            <label htmlFor="pfm-title" className="mb-2 block text-sm font-semibold text-slate-700">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              id="pfm-title"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., E-commerce Platform Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="pfm-desc" className="mb-2 block text-sm font-semibold text-slate-700">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="pfm-desc"
              rows="5"
              required
              className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Provide a comprehensive overview of your project, including goals, scope, and any specific requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">Provide detailed information about your project</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="pfm-category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Project Category
              </label>
              <select
                id="pfm-category"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category</option> 
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="Data Science">Data Science</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="DevOps">DevOps</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Blockchain">Blockchain</option>
                <option value="IoT">IoT (Internet of Things)</option>
                <option value="Game Development">Game Development</option>
                <option value="AR/VR">AR/VR</option>
                <option value="Database Systems">Database Systems</option>
                <option value="API Development">API Development</option>
                <option value="Automation">Automation</option>
                <option value="Embedded Systems">Embedded Systems</option>
                <option value="Research">Research</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="pfm-industry"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Industry/Domain
              </label>
              <select
                id="pfm-industry"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select an industry</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Technology">Technology</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Transportation">Transportation</option>
                <option value="Logistics">Logistics</option>  
                <option value="Agriculture">Agriculture</option>
                <option value="Energy">Energy</option>
                <option value="Government">Government</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Legal">Legal</option>
                <option value="Media">Media</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Sports">Sports</option>
                <option value="Social Impact">Social Impact</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <GearIcon />
              Technical Requirements
            </h3>
            <p className="mt-1 text-sm text-slate-500 ml-7">Skills and complexity level needed</p>
          </div>

          <div>
            <label htmlFor="pfm-skills" className="mb-2 block text-sm font-semibold text-slate-700">
              Skills Required <span className="text-red-500">*</span>
            </label>
            <input
              id="pfm-skills"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., React, Node.js, MySQL, AWS"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">Use commas to separate multiple skills</p>
          </div>

          <div>
            <label
              htmlFor="pfm-complexity"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Complexity Level
            </label>
            <select
              id="pfm-complexity"
              className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={complexityLevel}
              onChange={(e) => setComplexityLevel(e.target.value)}
            >
              <option value="">Select complexity level</option>
              <option value="Beginner">Beginner - Simple tasks, clear requirements</option>
              <option value="Intermediate">Intermediate - Moderate complexity, some ambiguity</option>
              <option value="Advanced">Advanced - Complex systems, research required</option>
            </select>
          </div>
        </div>

        {/* Project Scope */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <PackageIcon />
              Project Scope
            </h3>
            <p className="mt-1 text-sm text-slate-500 ml-7">Expected outcomes and deliverables</p>
          </div>

          <div>
            <label htmlFor="pfm-deliverables" className="mb-2 block text-sm font-semibold text-slate-700">
              Expected Deliverables
            </label>
            <textarea
              id="pfm-deliverables"
              rows="4"
              className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Working web application, Source code on GitHub, User documentation, Final presentation, Technical report..."
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">List all expected outputs from the project</p>
          </div>
        </div>

        {/* Team & Timeline */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <UsersIcon />
              Team & Timeline
            </h3>
            <p className="mt-1 text-sm text-slate-500 ml-7">Team requirements and project duration</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="pfm-team" className="mb-2 block text-sm font-semibold text-slate-700">
                Team Size
              </label>
              <input
                id="pfm-team"
                type="number"
                min="1"
                max="20"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., 4"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500">Number of students needed</p>
            </div>

            <div>
              <label htmlFor="pfm-start" className="mb-2 block text-sm font-semibold text-slate-700">
                Start Date
              </label>
              <input
                id="pfm-start"
                type="date"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="pfm-end" className="mb-2 block text-sm font-semibold text-slate-700">
                End Date
              </label>
              <input
                id="pfm-end"
                type="date"
                className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pfm-location" className="mb-2 block text-sm font-semibold text-slate-700">
              Project Location
            </label>
            <select
              id="pfm-location"
              className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
            >
              <option value="">Select location type</option>
              <option value="Remote">Remote - Students work from anywhere</option>
              <option value="On-site">On-site - Students must be physically present</option>
              <option value="Hybrid">Hybrid - Mix of remote and on-site work</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">Where will the team work on this project?</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}