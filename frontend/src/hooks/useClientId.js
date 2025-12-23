import { useMemo } from "react";

/**
 * Custom React hook to extract and manage client ID from localStorage
 * 
 * Handles both Firebase UID (string) and numeric ID formats.
 * Implements robust extraction logic with multiple fallback strategies
 * to ensure numeric client ID is retrieved correctly.
 * 
 * The hook checks in the following order:
 * 1. Direct numeric `id` field
 * 2. Explicit `numeric_id` field
 * 3. String-to-number conversion of `id`
 * 4. Fallback to `numeric_id` if main ID is Firebase UID
 * 
 * @hook
 * @returns {number|null} Numeric client ID or null if not found/invalid
 * 
 * @example
 * function ClientDashboard() {
 *   const clientId = useClientId();
 *   
 *   if (!clientId) {
 *     return <div>Please log in as a client</div>;
 *   }
 *   
 *   return <div>Welcome, Client #{clientId}</div>;
 * }
 * 
 * @example
 * // Using in API calls
 * function ClientProjects() {
 *   const clientId = useClientId();
 *   const { data: projects } = useQuery(['projects', clientId], () => 
 *     fetchClientProjects(clientId)
 *   );
 * }
 */
export const useClientId = () => {
  return useMemo(() => {
    try {
      const clientData = localStorage.getItem("client");
      
      if (!clientData) {
        console.warn("No client data found in localStorage");
        return null;
      }

      const client = JSON.parse(clientData);

      if (!client?.id) {
        console.warn("Client ID not found in client data");
        return null;
      }

      console.log("Raw client.id:", client.id, "Type:", typeof client.id);

      // Case 1: Direct numeric ID
      if (typeof client.id === "number") {
        console.log("Using numeric id:", client.id);
        return client.id;
      }

      // Case 2: Explicit numeric_id field
      if (client.numeric_id && typeof client.numeric_id === "number") {
        console.log("Using numeric_id:", client.numeric_id);
        return client.numeric_id;
      }

      // Case 3: Firebase UID detection (string length > 20)
      if (typeof client.id === "string" && client.id.length > 20) {
        console.warn(
          "Client ID appears to be Firebase UID, not numeric:",
          client.id
        );
        
        // Fallback to numeric_id if available
        if (client.numeric_id) {
          return client.numeric_id;
        }
      }

      // Case 4: String-to-number conversion
      if (typeof client.id === "string") {
        const numeric = parseInt(client.id, 10);
        if (!isNaN(numeric) && numeric > 0) {
          console.log("Parsed numeric id from string:", numeric);
          return numeric;
        }
      }

      console.warn("Could not extract valid numeric client ID");
      return null;
    } catch (error) {
      console.error("Error in useClientId:", error);
      return null;
    }
  }, []);
};