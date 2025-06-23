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
