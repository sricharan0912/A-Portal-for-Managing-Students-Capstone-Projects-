import { useEffect, useState } from "react";
import { apiCall } from "../utils/apiHelper";

/**
 * Client → My Teams Page
 * Displays teams assigned to client's projects with members
 */
export default function ClientTeamsView({ clientId }) {
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch client's projects
      const projectsRes = await apiCall(`/clients/${clientId}/projects`, { method: "GET" });
      const projectsData = projectsRes.data || projectsRes || [];
      setProjects(projectsData);
      
      console.log("Client projects:", projectsData);
      
      // Fetch teams with members from new endpoint
      const teamsRes = await apiCall(`/clients/${clientId}/teams`, { method: "GET" });
      const teamsData = teamsRes.data || [];
      
      console.log("Client teams:", teamsData);
      setTeams(teamsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  // Count projects with teams assigned
  const projectsWithTeams = [...new Set(teams.map(t => t.project_id))].length;
  const totalStudents = teams.reduce((acc, t) => acc + (t.member_count || t.members?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">Error loading teams: {error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Teams</h2>
        <p className="text-slate-500 text-sm mt-1">
          View your projects and assigned student teams
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
          <div className="text-xs text-slate-500">Total Projects</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{teams.length}</div>
          <div className="text-xs text-slate-500">Assigned Teams</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalStudents}</div>
          <div className="text-xs text-slate-500">Total Students</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {projects.filter(p => p.status === "approved").length}
          </div>
          <div className="text-xs text-slate-500">Approved</div>
        </div>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Teams Assigned Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Once the instructor assigns students to your projects, the teams will appear here.
          </p>
          
          {/* Show projects waiting for teams */}
          {projects.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Your {projects.length} project{projects.length !== 1 ? "s" : ""} waiting for team assignment:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {projects.map(p => (
                  <span key={p.id} className={`px-3 py-1 rounded-full text-xs font-medium ${
                    p.status === "approved" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {p.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.group_id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Team Header */}
              <button
                onClick={() => toggleTeam(team.group_id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {team.project_title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {team.member_count || team.members?.length || 0} member{(team.member_count || team.members?.length || 0) !== 1 ? "s" : ""}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        team.group_status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {team.group_status || "active"}
                      </span>
                    </div>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    expandedTeam === team.group_id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Members List */}
              {expandedTeam === team.group_id && (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Team Members</h4>
                  {team.members && team.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {team.members.map((member, idx) => (
                        <div
                          key={member.id || idx}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                            {(member.first_name?.[0] || "").toUpperCase()}
                            {(member.last_name?.[0] || "").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 truncate">
                                {member.full_name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unknown"}
                              </p>
                              {member.role === "leader" && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                                  Lead
                                </span>
                              )}
                            </div>
                            {member.email && (
                              <p className="text-sm text-slate-500 truncate">{member.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No members assigned yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Your Teams</h3>
            <p className="text-sm text-blue-800">
              These are the student teams working on your projects. Click on a team to view its members. Teams are assigned by the instructor once your project is approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}