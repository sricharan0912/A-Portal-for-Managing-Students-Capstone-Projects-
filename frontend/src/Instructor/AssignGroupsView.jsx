import React, { useState } from "react";
import { runGroupingAlgorithm } from "../utils/apiHelper";



const AssignGroupsView = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  const handleRunAlgorithm = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await runGroupingAlgorithm();
      setGroups(res.data?.groups || []);
    } catch (err) {
      console.error("Algorithm failed:", err);
      setError("Failed to run grouping algorithm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-groups-view">
      <h2>Assign Students to Groups</h2>

      <button onClick={handleRunAlgorithm} disabled={loading}>
        {loading ? "Running..." : "Run Group Formation Algorithm"}
      </button>

      {error && <p className="error">{error}</p>}

      <div className="groups-list">
        {groups.length > 0 ? (
          groups.map((group, index) => (
            <div key={index} className="group-card">
              <h3>Project: {group.project}</h3>
              <ul>
                {group.students.map((student) => (
                  <li key={student}>{student}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          !loading && <p>No groups yet. Click the button to generate.</p>
        )}
      </div>
    </div>
  );
};

export default AssignGroupsView;
