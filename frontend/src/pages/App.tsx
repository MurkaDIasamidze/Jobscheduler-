import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  const [jobName, setJobName] = useState("");
  const [command, setCommand] = useState("");
  const [scheduleText, setScheduleText] = useState(
    '{ "times": [{ "hour": 8, "minute": 0 }], "weekdays": [1], "months": [10], "years": [2025] }'
  );

  // Auto refresh jobs and executions every 10s for near real-time updates
  useEffect(() => {
    if (!token) return;
    fetchJobs();
    fetchExecutions();
    const interval = setInterval(() => {
      fetchJobs();
      fetchExecutions();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // --- API Actions ---
  async function login() {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      setEmail("");
      setPassword("");
    } catch (e: any) {
      alert("Login failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function register() {
    try {
      await axios.post(`${API}/auth/register`, { email, password, name });
      alert("Registered successfully! Now login.");
      setEmail("");
      setPassword("");
      setName("");
    } catch (e: any) {
      alert("Registration failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function fetchJobs() {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (e: any) {
      console.error(
        "Failed to fetch jobs: " + (e.response?.data?.error || e.message)
      );
    }
  }

  async function fetchExecutions() {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/executions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExecutions(res.data);
    } catch (e: any) {
      console.error(
        "Failed to fetch executions: " + (e.response?.data?.error || e.message)
      );
    }
  }

  async function createJob() {
    if (!token) return;
    try {
      const schedule = JSON.parse(scheduleText);
      const res = await axios.post(
        `${API}/jobs`,
        { name: jobName, command, schedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs([res.data, ...jobs]);
      setJobName("");
      setCommand("");
    } catch (e: any) {
      alert("Error creating job: " + (e.response?.data?.error || e.message));
    }
  }

  async function toggleJob(jobId: string, enabled: boolean) {
    if (!token) return;
    try {
      const res = await axios.put(
        `${API}/jobs/update`,
        { id: jobId, enabled: !enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, enabled: res.data.enabled } : job
        )
      );
    } catch (e: any) {
      alert("Failed to toggle job: " + (e.response?.data?.error || e.message));
    }
  }

  async function deleteJob(jobId: string) {
    if (!token) return;
    try {
      await axios.delete(`${API}/jobs/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: jobId },
      });
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (e: any) {
      alert("Failed to delete job: " + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setJobs([]);
    setExecutions([]);
    setEmail("");
    setPassword("");
    setName("");
  }

  // --- UI ---
  if (!token)
    return (
      <div className="container card p-4 border rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Login / Register</h2>
        <input
          className="input border p-2 mb-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input border p-2 mb-2 w-full"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input border p-2 mb-2 w-full"
          placeholder="Name (for register)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="button bg-blue-500 text-white p-2 rounded"
            onClick={login}
          >
            Login
          </button>
          <button
            className="button bg-green-500 text-white p-2 rounded"
            onClick={register}
          >
            Register
          </button>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Scheduler</h1>

      {/* Create Job */}
      <div className="card p-4 border rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Create Job</h2>
        <input
          className="input border p-2 mb-2 w-full"
          placeholder="Job Name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
        <input
          className="input border p-2 mb-2 w-full"
          placeholder="Command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <textarea
          className="input border p-2 mb-2 w-full"
          rows={4}
          value={scheduleText}
          onChange={(e) => setScheduleText(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="button bg-blue-500 text-white p-2 rounded"
            onClick={createJob}
          >
            Create Job
          </button>
          <button
            className="button bg-red-500 text-white p-2 rounded"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="card p-4 border rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Jobs</h2>
        {jobs.length === 0 ? (
          <div>No jobs yet</div>
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="border-b border-gray-300 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{job.name}</div>
                    <div className="text-sm text-gray-500">{job.command}</div>
                    <pre className="text-xs">
                      {JSON.stringify(job.schedule, null, 2)}
                    </pre>
                    <div>
                      Status: {job.enabled ? "✅ Enabled" : "❌ Disabled"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`button p-1 rounded ${
                        job.enabled
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                      onClick={() => toggleJob(job.id, job.enabled)}
                    >
                      {job.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="button bg-red-500 text-white p-1 rounded"
                      onClick={() => deleteJob(job.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Execution History */}
      <div className="card p-4 border rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Execution History</h2>
        {executions.length === 0 ? (
          <div>No executions yet</div>
        ) : (
          <ul>
            {executions.map((exec) => (
              <li key={exec.id} className="border-b border-gray-300 py-2">
                <div className="font-semibold">{exec.job.name}</div>
                <div>Success: {exec.success ? "✅" : "❌"}</div>
                <div>
                  Output: <pre>{exec.output}</pre>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(exec.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
