// This is the permanent fix: it pulls the address from your .env file
const API_BASE_URL = '/api';

/**
 * Generates a 3D model configuration for a plot based on dimensions.
 */
export const generatePlotMesh = async (length, width) => {
    const token = localStorage.getItem("token"); // Get your login "Security Pass"

    try {
        const response = await fetch(`${API_BASE_URL}/generate-plot-3d`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // This line fixes the "Unauthorized" error
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ length, width }),
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Unauthorized: Please log in again.");
            throw new Error(`Error generating mesh: ${response.statusText}`);
        }

        const data = await response.json();
        return data.glb_base64;
    } catch (error) {
        console.error("Failed to generate plot mesh:", error);
        throw error;
    }
};

/**
 * Checks the risk for a given location against high-risk zones.
 */
export const checkRisk = async (lat, lng) => {
    const token = localStorage.getItem("token"); // Use the token here too

    try {
        const response = await fetch(`${API_BASE_URL}/check-risk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Pass the security check
            },
            body: JSON.stringify({ lat, lng }),
        });

        if (!response.ok) {
            throw new Error(`Error checking risk: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to check risk:", error);
        throw error;
    }
};