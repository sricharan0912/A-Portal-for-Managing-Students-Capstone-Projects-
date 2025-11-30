/**
 * QuickStats Component
 * Displays dashboard statistics cards showing project counts by status
 *
 * @param {array} projects - Array of project objects
 */
export default function QuickStats({ projects = [] }) {
  // Calculate statistics using approval_status
  const totalProjects = projects.length;
  const approvedProjects = projects.filter(
    (p) => p.approval_status === "approved"
  ).length;
  const pendingProjects = projects.filter(
    (p) => p.approval_status === "pending" || !p.approval_status
  ).length;

  const stats = [
    {
      id: "total",
      label: "Total Projects",
      value: totalProjects,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: (
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      id: "approved",
      label: "Approved",
      value: approvedProjects,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      icon: (
        <svg
          className="h-6 w-6"
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
      ),
    },
    {
      id: "pending",
      label: "Pending Approval",
      value: pendingProjects,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      icon: (
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-slate-600">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`rounded-lg ${stat.bgColor} p-3`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}