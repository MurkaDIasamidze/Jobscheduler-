import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function checkServerHealth() {
  try {
    const res = await axios.get(`${API}/health`, { timeout: 5000 });
    return res.data;
  } catch (e: any) {
    if (e.code === "ECONNABORTED" || e.code === "ERR_NETWORK") {
      throw new Error("Cannot connect to backend server");
    } else if (e.response?.status === 500) {
      throw new Error("Database connection failed");
    }
    throw new Error(e.message);
  }
}

export async function login(email: string, password: string) {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data.token;
}

export async function register(email: string, password: string, name: string) {
  await axios.post(`${API}/auth/register`, { email, password, name });
}

export async function fetchJobs(token: string) {
  const res = await axios.get(`${API}/jobs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function createJob(token: string, payload: any) {
  const res = await axios.post(`${API}/jobs`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function toggleJob(token: string, id: number, enabled: boolean) {
  const res = await axios.put(`${API}/jobs/${id}`, { enabled: !enabled }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deleteJob(token: string, id: number) {
  await axios.delete(`${API}/jobs/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function runJob(token: string, id: number) {
  await axios.post(`${API}/jobs/${id}/run`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function fetchExecutions(token: string) {
  const res = await axios.get(`${API}/executions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
