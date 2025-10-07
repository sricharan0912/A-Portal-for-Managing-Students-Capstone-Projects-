import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState([]);

  // ✅ Fetch stored client + their projects on page load
  useEffect(() => {
    const storedClient = JSON.parse(localStorage.getItem("client"));
    if (!storedClient) {
      alert("Please log in again.");
      window.location.href = "/login";
      return;
    }

    setClient(storedClient);
    fetchProjects(storedClient.id);
  }, []);

  // ✅ Fetch all projects for the logged-in client
  const fetchProjects = async (clientId) => {
    if (!clientId) return;
    try {
      const res = await fetch(`http://localhost:5050/projects/${clientId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Bad response:", text);
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // ✅ Handle new project creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) {
      alert("Client not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          title,
          description,
          skills_required: skills,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create project");

      alert("✅ Project posted successfully!");
      setProjects([...projects, { title, description, skills_required: skills }]);
      setTitle("");
      setDescription("");
      setSkills("");
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("client");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-900 h-32 w-full"></div>

      <div className="flex-grow px-6 -mt-16">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8 animate-slideUp">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-blue-900">
              Welcome, {client?.name || "Client"}
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div>

          {/* Post New Project */}
          <h2 className="text-lg font-semibold mb-4 text-blue-800">Post a New Project</h2>
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <input
              type="text"
              placeholder="Project Title *"
              className="border rounded-md p-3 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Project Description *"
              className="border rounded-md p-3 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <input
              type="text"
              placeholder="Skills Required *"
              className="border rounded-md p-3 w-full"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-md transition"
            >
              Create Project
            </button>
          </form>

          {/* Posted Projects */}
          <h2 className="text-lg font-semibold mb-4 text-blue-800">Your Projects</h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((p, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="text-blue-800 font-semibold">{p.title}</h3>
                  <p className="text-gray-600 mt-2">{p.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Skills: {p.skills_required}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No projects posted yet.</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
