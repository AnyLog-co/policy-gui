// api.js
const API_BASE_URL = "http://localhost:8000"; // Adjust if needed

export async function pingBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/ping`);
    if (!response.ok) throw new Error("Ping failed");
    return await response.json();
  } catch (err) {
    console.error("API ping error:", err);
    return null;
  }
}

export async function submitPolicy(nodeAddress, type, policyData) {
  try {
    console.log("Submitting policy:", {
      node: nodeAddress,
      type,
      policyData
    });
    const response = await fetch(`${API_BASE_URL}/submit/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node: nodeAddress,
        policy: policyData
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { error: "Failed to submit policy" };
  }
}
