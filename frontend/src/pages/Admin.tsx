import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  const [jobName, setJobName] = useState("");
  const [command, setCommand] = useState("");
  const [scheduleText, setScheduleText] = useState(
    JSON.stringify({ year: 2025, month: 1, day: 1, hour: 8, minute: 0 }, null, 2)
  );

  // --- Fetch data ---
  useEffect(() => {
    if (!token) return;

    fetchUsers();
    fetchJobs();
    fetchExecutions();

    const interval = setInterval(() => {
      fetchJobs();
      fetchExecutions();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  // === AUTH ===
  async function login() {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
    } catch (e: any) {
      alert("Login failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function register() {
    try {
      await axios.post(`${API}/auth/register`, { name, email, password });
      alert("Registered successfully! You can now log in.");
    } catch (e: any) {
      alert("Registration failed: " + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsers([]);
    setJobs([]);
    setExecutions([]);
  }

  // === USERS ===
  async function fetchUsers() {
    try {
      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (e: any) {
      console.error("Fetch users failed:", e);
    }
  }

  async function changeRole(id: string, role: string) {
    try {
      const res = await axios.put(
        `${API}/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: res.data.role } : u)));
    } catch (e: any) {
      alert("Change role failed: " + (e.response?.data?.error || e.message));
    }
  }

  // === JOBS ===
  async function fetchJobs() {
    try {
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (e: any) {
      console.error("Fetch jobs failed:", e);
    }
  }

  async function createJob() {
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
      alert("Create job failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function toggleJob(id: string, enabled: boolean) {
    try {
      const res = await axios.put(
        `${API}/jobs/${id}`,
        { enabled: !enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, enabled: res.data.enabled } : job)));
    } catch (e: any) {
      alert("Toggle job failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function deleteJob(id: string) {
    try {
      await axios.delete(`${API}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) {
      alert("Delete job failed: " + (e.response?.data?.error || e.message));
    }
  }

  // === EXECUTIONS ===
  async function fetchExecutions() {
    try {
      const res = await axios.get(`${API}/executions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExecutions(res.data);
    } catch (e: any) {
      console.error("Fetch executions failed:", e);
    }
  }

  // === LOGIN / REGISTER UI ===
  if (!token)
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-slate-800 rounded shadow text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Login / Register</h2>
        <input
          className="input mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input mb-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input mb-4"
          placeholder="Name (register only)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2 justify-center">
          <button className="button bg-blue-500 hover:bg-blue-400" onClick={login}>
            Login
          </button>
          <button className="button bg-green-500 hover:bg-green-400" onClick={register}>
            Register
          </button>
        </div>
      </div>
    );

  // === MAIN DASHBOARD ===
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel / Scheduler</h1>
        <button className="button bg-red-600 hover:bg-red-500" onClick={logout}>
          Logout
        </button>
      </div>

      {/* USERS */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-700">
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td className="flex gap-2 py-1">
                  <button
                    className="button bg-blue-500 hover:bg-blue-400 text-black"
                    onClick={() => changeRole(u.id, "user")}
                  >
                    Set User
                  </button>
                  <button
                    className="button bg-green-500 hover:bg-green-400 text-black"
                    onClick={() => changeRole(u.id, "admin")}
                  >
                    Set Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE JOB */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Create Job</h2>
        <input
          className="input"
          placeholder="Job name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <textarea
          className="input h-24"
          value={scheduleText}
          onChange={(e) => setScheduleText(e.target.value)}
        />
        <button className="button bg-blue-500 hover:bg-blue-400" onClick={createJob}>
          Create Job
        </button>
      </div>

      {/* JOBS */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Jobs</h2>
        {jobs.map((job) => (
          <div key={job.id} className="flex justify-between border-b border-slate-700 py-2">
            <div>
              <div className="font-semibold">{job.name}</div>
              <div className="text-sm text-slate-400">{job.command}</div>
              <pre className="text-xs text-slate-500">
                {JSON.stringify(job.schedule, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                className={`button ${
                  job.enabled ? "bg-yellow-500 hover:bg-yellow-400" : "bg-green-500 hover:bg-green-400"
                }`}
                onClick={() => toggleJob(job.id, job.enabled)}
              >
                {job.enabled ? "Disable" : "Enable"}
              </button>
              <button
                className="button bg-red-500 hover:bg-red-400"
                onClick={() => deleteJob(job.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EXECUTIONS */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Executions</h2>
        {executions.map((ex) => (
          <div key={ex.id} className="border-b border-slate-700 py-2">
            <div className="font-semibold">{ex.job?.name}</div>
            <div>Success: {ex.success ? "✅" : "❌"}</div>
            <div>
              Output: <pre className="text-xs text-slate-400">{ex.output}</pre>
            </div>
            <div className="text-xs text-slate-500">{new Date(ex.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
