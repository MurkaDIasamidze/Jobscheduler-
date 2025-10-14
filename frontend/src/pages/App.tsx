import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function App() {
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
    JSON.stringify({ month: 1, year: 2025, day: 1, hour: 8, minute: 0 }, null, 2)
  );

  // --- Fetch data ---
  useEffect(() => {
    if (!token) return;

    fetchUsers();
    fetchJobs();
    fetchExecutions();

    const interval = setInterval(() => {
      fetchUsers();
      fetchJobs();
      fetchExecutions();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

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
      await axios.post(`${API}/auth/register`, { email, password, name });
      alert("Registered successfully! Now login.");
    } catch (e: any) {
      alert("Registration failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function fetchUsers() {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (e: any) {
      console.error("Fetch users error", e);
    }
  }

  async function changeRole(id: string, role: string) {
    if (!token) return;
    try {
      const res = await axios.put(
        `${API}/users`,
        { id, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: res.data.role } : u)));
    } catch (e: any) {
      alert("Update role failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function fetchJobs() {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/jobs`, { headers: { Authorization: `Bearer ${token}` } });
      setJobs(res.data);
    } catch (e: any) {
      console.error("Fetch jobs error", e);
    }
  }

  async function fetchExecutions() {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/executions`, { headers: { Authorization: `Bearer ${token}` } });
      setExecutions(res.data);
    } catch (e: any) {
      console.error("Fetch executions error", e);
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

  async function toggleJob(id: string, enabled: boolean) {
    if (!token) return;
    try {
      const res = await axios.put(
        `${API}/jobs/update`,
        { id, enabled: !enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? { ...job, enabled: res.data.enabled } : job))
      );
    } catch (e: any) {
      alert("Error toggling job: " + (e.response?.data?.error || e.message));
    }
  }

  async function deleteJob(id: string) {
    if (!token) return;
    try {
      await axios.delete(`${API}/jobs/delete`, { headers: { Authorization: `Bearer ${token}` }, data: { id } });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) {
      alert("Error deleting job: " + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsers([]);
    setJobs([]);
    setExecutions([]);
  }

  // --- LOGIN / REGISTER ---
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

  // --- MAIN APP ---
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Admin Panel / Job Scheduler</h1>
        <button className="button bg-red-600 hover:bg-red-500" onClick={logout}>Logout</button>
      </div>

      {/* Users */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Users</h2>
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th>Email</th><th>Name</th><th>Role</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-700">
                <td>{u.email}</td>
                <td>{u.name || "-"}</td>
                <td>{u.role}</td>
                <td className="flex gap-2 py-1">
                  <button className="button bg-blue-500 hover:bg-blue-400 text-black" onClick={() => changeRole(u.id, "user")}>Set User</button>
                  <button className="button bg-green-500 hover:bg-green-400 text-black" onClick={() => changeRole(u.id, "admin")}>Set Admin</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Job Creator */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Create Job</h2>
        <input className="input" placeholder="Job Name" value={jobName} onChange={e => setJobName(e.target.value)} />
        <input className="input" placeholder="Command" value={command} onChange={e => setCommand(e.target.value)} />
        <textarea className="input h-24" value={scheduleText} onChange={e => setScheduleText(e.target.value)} />
        <div className="flex gap-2">
          <button className="button bg-blue-500 hover:bg-blue-400" onClick={createJob}>Create</button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Jobs</h2>
        {jobs.map(job => (
          <div key={job.id} className="flex justify-between border-b border-slate-700 py-2">
            <div>
              <div className="font-semibold text-white">{job.name}</div>
              <div className="text-sm text-slate-300">{job.command}</div>
              <pre className="text-xs text-slate-400">{JSON.stringify(job.schedule, null, 2)}</pre>
            </div>
            <div className="flex gap-2">
              <button className={`button ${job.enabled ? "bg-yellow-500 hover:bg-yellow-400" : "bg-green-500 hover:bg-green-400"}`} onClick={() => toggleJob(job.id, job.enabled)}>
                {job.enabled ? "Disable" : "Enable"}
              </button>
              <button className="button bg-red-500 hover:bg-red-400" onClick={() => deleteJob(job.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Executions */}
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Executions</h2>
        {executions.map(ex => (
          <div key={ex.id} className="border-b border-slate-700 py-2 text-slate-200">
            <div className="font-semibold">{ex.job?.name}</div>
            <div>Success: {ex.success ? "✅" : "❌"}</div>
            <div>Output: <pre className="text-xs">{ex.output}</pre></div>
            <div className="text-xs text-slate-400">{new Date(ex.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
