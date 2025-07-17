// api.js
const API_BASE_URL = "http://localhost:8000"; // Adjust if needed

export async function login(nodeAddress, pubkey) {
  if (!nodeAddress || !pubkey) {
    return { error: "Missing node address or pubkey" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node: nodeAddress,
        pubkey: pubkey
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Login failed" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Could not connect to server" };
  }
}


export async function submitPolicy(nodeAddress, policyType, formData) {
  if (!nodeAddress || !policyType || !formData) {
    return { error: "Missing required inputs" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node: nodeAddress,
        policy_file: policyType,
        policy: formData
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Submission failed" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error("Submit policy error:", err);
    return { error: "Could not connect to server" };
  }
}


export async function getPolicyTemplate(policyType) {
  try {
    const response = await fetch(`${API_BASE_URL}/policy-template/${policyType}`);
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch policy template", err);
    return null;
  }
}

export async function fetchPolicyTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/policy-types`);
    const data = await response.json();

    if (response.ok && data.types) {
      return data.types; // expected to be an array of { type, name }
    } else {
      console.error("Invalid policy types response:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching policy types:", error);
    return [];
  }
}

export async function fetchNodeOptions(nodeAddress) {
  try {
    const res = await fetch(`${API_BASE_URL}/node-options/${nodeAddress}`);
    const data = await res.json();
    return data.options || [];
  } catch (error) {
    console.error("Error fetching node options:", error);
    return [];
  }
}

export async function fetchTableOptions(nodeAddress) {
  try {
    const res = await fetch(`${API_BASE_URL}/table-options/${nodeAddress}`);
    const data = await res.json();
    return data.options || [];
  } catch (error) {
    console.error("Error fetching table options:", error);
    return [];
  }
}


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

export async function fetchPermissions(nodeAddress) {
  const res = await fetch(`${API_BASE_URL}/permissions/${nodeAddress}`);
  // console.log("Permissions response:", res);
  return res.ok ? await res.json() : { roles: [], allowed_policy_types: [] };
}

export async function fetchUserPermissions(node, pubkey) {
  // console.log("Fetching user permissions for:", node, pubkey);
  try {
    const response = await fetch(`${API_BASE_URL}/user-permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node, pubkey }),
    });
    // console.log("User permissions response:", response);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Failed to fetch user permissions" };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error("fetchUserPermissions error:", err);
    return { error: "Could not connect to server" };
  }
}