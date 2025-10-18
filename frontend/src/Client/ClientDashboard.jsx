import { useEffect, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";

const NAVBAR_HEIGHT = 64;
const DRAWER_WIDTH = 280;

export default function ClientDashboard() {
  const clientData = localStorage.getItem("client");
  const client = clientData ? JSON.parse(clientData) : null;

  const animationStyles = `
    @keyframes fadeInSlideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .form-enter { animation: fadeInSlideDown 400ms ease-out forwards; }
  `;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [category, setCategory] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [complexityLevel, setComplexityLevel] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!client?.id) return;
    fetch(`http://localhost:5050/projects/${client.id}`)
      .then((r) => r.json())
      .then((data) => {
        Array.isArray(data) && setProjects(data);
      })
      .catch((err) => console.error('Error fetching projects:', err));
  }, [client?.id]);

  const handleLogout = () => {
    localStorage.removeItem("client");
    window.location.href = "/login";
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSkills("");
    setCategory("");
    setTeamSize("");
    setStartDate("");
    setEndDate("");
    setComplexityLevel("");
    setDeliverables("");
    setProjectLocation("");
    setIndustry("");
  };

  const deleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const res = await fetch(`http://localhost:5050/projects/${projectId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete project");
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        alert("Project deleted successfully!");
      } catch (err) {
        alert("Error deleting project: " + err.message);
      }
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !skills.trim()) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      if (editingProject) {
        // UPDATE existing project
        const res = await fetch(`http://localhost:5050/projects/${editingProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            skills_required: skills,
            category: category || null,
            team_size: teamSize ? parseInt(teamSize) : null,
            start_date: startDate || null,
            end_date: endDate || null,
            complexity_level: complexityLevel || null,
            deliverables: deliverables || null,
            project_location: projectLocation || null,
            industry: industry || null,
            status: editingProject.status
          }),
        });
        if (!res.ok) throw new Error("Failed to update project");
        
        setProjects((prev) => prev.map((p) => p.id === editingProject.id ? { ...p, title, description, skills_required: skills, category, team_size: teamSize ? parseInt(teamSize) : null, start_date: startDate, end_date: endDate, complexity_level: complexityLevel, deliverables: deliverables, project_location: projectLocation, industry: industry } : p));
        resetForm();
        setEditingProject(null);
        setShowCreateForm(false);
        alert("✅ Project updated!");
      } else {
        // CREATE new project
        const res = await fetch("http://localhost:5050/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: client.id,
            title,
            description,
            skills_required: skills,
            category: category || null,
            team_size: teamSize ? parseInt(teamSize) : null,
            start_date: startDate || null,
            end_date: endDate || null,
            complexity_level: complexityLevel || null,
            deliverables: deliverables || null,
            project_location: projectLocation || null,
            industry: industry || null,
            status: 'open'
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create project");

        setProjects((prev) => [...prev, { id: data?.id || Date.now(), title, description, skills_required: skills, category, team_size: teamSize ? parseInt(teamSize) : null, start_date: startDate, end_date: endDate, complexity_level: complexityLevel, deliverables: deliverables, project_location: projectLocation, industry: industry, status: 'open' }]);
        resetForm();
        setShowCreateForm(false);
        alert("✅ Project created!");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setSkills(project.skills_required);
    setCategory(project.category || "");
    setTeamSize(project.team_size || "");
    setStartDate(project.start_date || "");
    setEndDate(project.end_date || "");
    setComplexityLevel(project.complexity_level || "");
    setDeliverables(project.deliverables || "");
    setProjectLocation(project.project_location || "");
    setIndustry(project.industry || "");
    setShowCreateForm(true);
  };

  const NavItem = ({ id, icon, label }) => {
    const isActive = active === id;
    return (
      <button onClick={() => { setActive(id); if (window.innerWidth < 1024) setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
        <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>
        {label}
      </button>
    );
  };

  const ProjectCard = ({ project, category }) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-800 text-sm">{project.title}</h4>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${category === 'approved' ? 'bg-green-100 text-green-700' : category === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {project.status || 'open'}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-600 line-clamp-2">{project.description}</p>
      <div className="flex gap-2">
        <button onClick={() => startEdit(project)} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button onClick={() => deleteProject(project.id)} className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 hover:border-red-400">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <style>{animationStyles}</style>
      <DashboardNavbar role="client" title="Client Dashboard" userName={client?.name} onMenuClick={() => setSidebarOpen((s) => !s)} onLogout={handleLogout} />

      <aside className="fixed left-0 z-40 h-[calc(100vh-64px)] bg-blue-900 text-blue-50 shadow-xl transition-transform duration-300 ease-in-out" style={{ top: `${NAVBAR_HEIGHT}px`, width: `${DRAWER_WIDTH}px`, transform: sidebarOpen ? "translateX(0px)" : `translateX(-${DRAWER_WIDTH}px)` }}>
        <div className="space-y-5 p-4">
          <div className="px-1"><p className="text-xs uppercase tracking-wide text-blue-200">Client Portal</p></div>
          <nav className="space-y-1">
            <NavItem id="dashboard" label="My Dashboard" icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
            <NavItem id="projects" label="My Projects" icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" /></svg>} />
            <NavItem id="teams" label="My Teams" icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          </nav>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} style={{ top: `${NAVBAR_HEIGHT}px` }} />}

      <div className="flex-1 px-4 transition-[margin] duration-300 ease-in-out sm:px-6 lg:px-8" style={{ marginTop: `${NAVBAR_HEIGHT}px`, marginLeft: sidebarOpen ? `${DRAWER_WIDTH}px` : "0px", paddingTop: "1.5rem", paddingBottom: "2rem" }}>
        <main className="mx-auto max-w-7xl pb-8">
          {active === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-base font-semibold text-slate-800">Tasks</h3>
                  <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">No tasks available.</div>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-base font-semibold text-slate-800">Upcoming Events</h3>
                  <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">You have no upcoming events.</div>
                </section>
              </div>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-slate-800">Recommended Experiences</h3>
                <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">Recommendations will appear here as your project activity grows.</p>
              </section>
            </div>
          )}

          {active === "projects" && (
            <div className="space-y-6">
              {!showCreateForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div><div className="flex items-center gap-2"><svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg><h2 className="text-2xl font-bold text-slate-800">My Projects</h2></div><p className="mt-1 text-sm text-slate-500">Manage your proposals and track progress</p></div>
                    <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Create Project
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-green-300">
                      <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-green-100 p-2.5"><svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><h3 className="text-base font-semibold text-slate-800">Approved Projects</h3><p className="text-xs text-slate-500">Active & completed</p></div></div>
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        {projects.filter(p => p.status === 'approved' || p.status === 'closed').length === 0 ? <p className="text-sm text-slate-500">No approved projects yet</p> : projects.filter(p => p.status === 'approved' || p.status === 'closed').map(p => <ProjectCard key={p.id} project={p} category="approved" />)}
                      </div>
                    </section>

                    <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-red-300">
                      <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-red-100 p-2.5"><svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><h3 className="text-base font-semibold text-slate-800">Rejected Projects</h3><p className="text-xs text-slate-500">Needs revision</p></div></div>
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        {projects.filter(p => p.status === 'rejected').length === 0 ? <p className="text-sm text-slate-500">No rejected projects</p> : projects.filter(p => p.status === 'rejected').map(p => <ProjectCard key={p.id} project={p} category="rejected" />)}
                      </div>
                    </section>

                    <section className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-yellow-300">
                      <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-yellow-100 p-2.5"><svg className="h-5 w-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><h3 className="text-base font-semibold text-slate-800">Pending Projects</h3><p className="text-xs text-slate-500">Awaiting proposals</p></div></div>
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        {projects.filter(p => p.status === 'open' || !p.status).length === 0 ? <p className="text-sm text-slate-500">No pending projects</p> : projects.filter(p => p.status === 'open' || !p.status).map(p => <ProjectCard key={p.id} project={p} category="pending" />)}
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <div className="form-enter rounded-2xl bg-white p-8 shadow-lg">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
                    <div><h2 className="text-3xl font-bold text-slate-900">{editingProject ? "Edit Project" : "Create a New Project"}</h2><p className="mt-2 text-slate-600">{editingProject ? "Update your project details" : "Provide detailed information about your project so students can understand your requirements."}</p></div>
                    <button onClick={() => { setShowCreateForm(false); resetForm(); setEditingProject(null); }} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <form onSubmit={createProject} className="space-y-8">
                    <div className="space-y-6">
                      <div><h3 className="text-lg font-bold text-slate-900">📋 Basic Information</h3><p className="mt-1 text-sm text-slate-500">Essential details about your project</p></div>
                      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Project Title <span className="text-red-500">*</span></label><input type="text" required className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="e.g., E-commerce Platform Development" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Project Description <span className="text-red-500">*</span></label><textarea required rows="6" className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Describe the problem, scope, deliverables, timeline, and any specific constraints or requirements..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Project Category</label><select className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Select a category</option><option value="Web Development">Web Development</option><option value="Mobile App">Mobile App</option><option value="Data Science">Data Science</option><option value="Machine Learning">Machine Learning</option><option value="UI/UX Design">UI/UX Design</option></select></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Industry/Domain</label><select className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={industry} onChange={(e) => setIndustry(e.target.value)}><option value="">Select an industry</option><option value="Healthcare">Healthcare</option><option value="Finance">Finance</option><option value="Education">Education</option><option value="E-commerce">E-commerce</option></select></div></div>
                    </div>

                    <div className="space-y-6"><div><h3 className="text-lg font-bold text-slate-900">⚙️ Technical Requirements</h3><p className="mt-1 text-sm text-slate-500">Skills and complexity level needed</p></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Skills Required <span className="text-red-500">*</span></label><input type="text" required className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="e.g., React, Node.js, MySQL, AWS" value={skills} onChange={(e) => setSkills(e.target.value)} /><p className="mt-1.5 text-xs text-slate-500">Use commas to separate multiple skills</p></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Complexity Level</label><select className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={complexityLevel} onChange={(e) => setComplexityLevel(e.target.value)}><option value="">Select complexity level</option><option value="Beginner">Beginner - Simple tasks, clear requirements</option><option value="Intermediate">Intermediate - Moderate complexity, some ambiguity</option><option value="Advanced">Advanced - Complex systems, research required</option></select></div></div>

                    <div className="space-y-6"><div><h3 className="text-lg font-bold text-slate-900">📦 Project Scope</h3><p className="mt-1 text-sm text-slate-500">Expected outcomes and deliverables</p></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Expected Deliverables</label><textarea rows="4" className="w-full resize-y rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="e.g., Working web application, Source code on GitHub, User documentation, Final presentation, Technical report..." value={deliverables} onChange={(e) => setDeliverables(e.target.value)} /><p className="mt-1.5 text-xs text-slate-500">List all expected outputs from the project</p></div></div>

                    <div className="space-y-6"><div><h3 className="text-lg font-bold text-slate-900">👥 Team & Timeline</h3><p className="mt-1 text-sm text-slate-500">Team requirements and project duration</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-3"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Team Size</label><input type="number" min="1" max="20" className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="e.g., 4" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} /><p className="mt-1.5 text-xs text-slate-500">Number of students needed</p></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Start Date</label><input type="date" className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">End Date</label><input type="date" className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Project Location</label><select className="w-full rounded-lg border border-slate-300 p-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)}><option value="">Select location type</option><option value="Remote">Remote - Students work from anywhere</option><option value="On-site">On-site - Students must be physically present</option><option value="Hybrid">Hybrid - Mix of remote and on-site work</option></select><p className="mt-1.5 text-xs text-slate-500">Where will the team work on this project?</p></div></div>

                    <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">
                      <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); setEditingProject(null); }} className="rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                      <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{editingProject ? "Update Project" : "Create Project"}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {active === "teams" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-base font-semibold text-slate-800">My Teams</h3>
              <p className="mb-4 text-sm text-slate-500">This section will show teams assigned to your projects.</p>
              <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No teams yet<br /><span className="text-xs">Teams will appear here when projects are assigned.</span></div>
            </section>
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © 2025 Capstone Hub. All rights reserved. | Contact: <a className="text-blue-600 hover:underline" href="mailto:support@capstonehub.com">support@capstonehub.com</a>
      </footer>
    </div>
  );
}