import { useMemo } from "react";

/**
 * Custom hook to extract and manage client ID from localStorage
 * Handles both Firebase UID (string) and numeric ID formats
 * 
 * Returns the numeric client ID or null if not found/invalid
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

      
      if (typeof client.id === "number") {
        console.log("Using numeric id:", client.id);
        return client.id;
      }

      
      if (client.numeric_id && typeof client.numeric_id === "number") {
        console.log("Using numeric_id:", client.numeric_id);
        return client.numeric_id;
      }

      
      if (typeof client.id === "string" && client.id.length > 20) {
        console.warn(
          "Client ID appears to be Firebase UID, not numeric:",
          client.id
        );
        
        
        if (client.numeric_id) {
          return client.numeric_id;
        }
      }

      
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