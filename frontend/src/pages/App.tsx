import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const SCHEDULES: Record<string, string> = {
  "0 * * * * *": "Every minute",
  "0 */5 * * * *": "Every 5 minutes",
  "0 */15 * * * *": "Every 15 minutes",
  "0 0 * * * *": "Every hour",
  "0 0 8 * * *": "Daily at 8 AM",
  "0 0 0 * * *": "Daily at midnight",
  "0 0 8 * * 1": "Weekly (Monday 8 AM)",
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [jobName, setJobName] = useState("");
  const [command, setCommand] = useState("");
  const [schedule, setSchedule] = useState("0 * * * * *");

  useEffect(() => {
    if (token) {
      fetchJobs();
      fetchExecutions();
      const interval = setInterval(() => {
        fetchJobs();
        fetchExecutions();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  async function login() {
    console.log("[LOGIN] Attempting login for:", email);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      console.log("[LOGIN] Success:", res.data);
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
    } catch (e: any) {
      console.error("[LOGIN] Failed:", e.response?.data || e.message);
      alert("Login failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function register() {
    console.log("[REGISTER] Attempting registration for:", email);
    try {
      await axios.post(`${API}/auth/register`, { email, password, name });
      console.log("[REGISTER] Success");
      alert("Registered! Now login.");
    } catch (e: any) {
      console.error("[REGISTER] Failed:", e.response?.data || e.message);
      alert("Registration failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function fetchJobs() {
    console.log("[FETCH_JOBS] Fetching jobs...");
    try {
      const res = await axios.get(`${API}/jobs`, { headers: { Authorization: `Bearer ${token}` } });
      console.log("[FETCH_JOBS] Success, found", res.data.length, "jobs");
      setJobs(res.data);
    } catch (e: any) {
      console.error("[FETCH_JOBS] Failed:", e.response?.data || e.message);
      if (e.response?.status === 401) {
        console.warn("[FETCH_JOBS] Unauthorized - token may be invalid");
        localStorage.removeItem("token");
        setToken(null);
      }
    }
  }

  async function createJob() {
    if (!jobName || !command) {
      console.warn("[CREATE_JOB] Validation failed: missing fields");
      return alert("Fill all fields");
    }
    console.log("[CREATE_JOB] Creating job:", { jobName, schedule });
    try {
      const commands = command.split("\n").filter(c => c.trim());
      const res = await axios.post(
        `${API}/jobs`,
        { name: jobName, commands, schedule, enabled: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[CREATE_JOB] Success:", res.data);
      setJobs([res.data, ...jobs]);
      setJobName("");
      setCommand("");
      alert("Job created!");
    } catch (e: any) {
      console.error("[CREATE_JOB] Failed:", e.response?.data || e.message);
      alert("Error: " + (e.response?.data?.error || e.message));
    }
  }

  async function toggleJob(id: number, enabled: boolean) {
    console.log("[TOGGLE_JOB] Toggling job", id, "to", !enabled);
    try {
      const res = await axios.put(`${API}/jobs/${id}`, { enabled: !enabled }, { headers: { Authorization: `Bearer ${token}` } });
      console.log("[TOGGLE_JOB] Success:", res.data);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: res.data.enabled } : j));
    } catch (e: any) {
      console.error("[TOGGLE_JOB] Failed:", e.response?.data || e.message);
      alert("Toggle failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function deleteJob(id: number) {
    if (!confirm("Delete job?")) return;
    console.log("[DELETE_JOB] Deleting job", id);
    try {
      await axios.delete(`${API}/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      console.log("[DELETE_JOB] Success");
      setJobs(prev => prev.filter(j => j.id !== id));
      alert("Job deleted!");
    } catch (e: any) {
      console.error("[DELETE_JOB] Failed:", e.response?.data || e.message);
      alert("Delete failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function runJobNow(id: number) {
    console.log("[RUN_JOB] Running job", id);
    try {
      await axios.post(`${API}/jobs/${id}/run`, {}, { headers: { Authorization: `Bearer ${token}` } });
      console.log("[RUN_JOB] Success - job started");
      alert("Job started!");
      setTimeout(fetchExecutions, 2000);
    } catch (e: any) {
      console.error("[RUN_JOB] Failed:", e.response?.data || e.message);
      alert("Error: " + (e.response?.data?.error || e.message));
    }
  }

  async function fetchExecutions() {
    console.log("[FETCH_EXECUTIONS] Fetching executions...");
    try {
      const res = await axios.get(`${API}/executions`, { headers: { Authorization: `Bearer ${token}` } });
      console.log("[FETCH_EXECUTIONS] Success, found", res.data.length, "executions");
      setExecutions(res.data);
    } catch (e: any) {
      console.error("[FETCH_EXECUTIONS] Failed:", e.response?.data || e.message);
      if (e.response?.status === 401) {
        console.warn("[FETCH_EXECUTIONS] Unauthorized - token may be invalid");
      }
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-slate-800 rounded-lg text-white space-y-3">
          <h2 className="text-2xl font-bold text-center">Job Scheduler</h2>
          <input className="w-full px-4 py-2 bg-slate-700 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full px-4 py-2 bg-slate-700 rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="w-full px-4 py-2 bg-slate-700 rounded" placeholder="Name (for register)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded" onClick={login}>Login</button>
            <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded" onClick={register}>Register</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded">
          <h1 className="text-2xl font-bold">Job Scheduler</h1>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded" onClick={() => { localStorage.removeItem("token"); setToken(null); }}>Logout</button>
        </div>

        {/* Create Job */}
        <div className="bg-slate-800 p-6 rounded space-y-3">
          <h2 className="text-xl font-bold">Create Job</h2>
          <input className="w-full px-4 py-2 bg-slate-700 rounded" placeholder="Job Name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
          <textarea className="w-full px-4 py-2 bg-slate-700 rounded h-20" placeholder="Commands (one per line)" value={command} onChange={(e) => setCommand(e.target.value)} />
          <select className="w-full px-4 py-2 bg-slate-700 rounded" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            {Object.entries(SCHEDULES).map(([cron, label]) => (
              <option key={cron} value={cron}>{label}</option>
            ))}
          </select>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded" onClick={createJob}>Create</button>
        </div>

        {/* Jobs */}
        <div className="bg-slate-800 p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Jobs ({jobs.length})</h2>
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-700 p-4 rounded mb-3">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{job.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${job.enabled ? "bg-green-600" : "bg-gray-600"}`}>
                      {job.enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 mt-1">
                    {job.commands?.map((cmd: string, i: number) => (
                      <div key={i} className="font-mono text-xs">{cmd}</div>
                    ))}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{SCHEDULES[job.schedule] || job.schedule}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm" onClick={() => runJobNow(job.id)}>Run</button>
                  <button className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm" onClick={() => toggleJob(job.id, job.enabled)}>
                    {job.enabled ? "Disable" : "Enable"}
                  </button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm" onClick={() => deleteJob(job.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Executions */}
        <div className="bg-slate-800 p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Executions ({executions.length})</h2>
          {executions.slice(0, 10).map((ex) => (
            <div key={ex.id} className="bg-slate-700 p-3 rounded mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold">Job {ex.job_id}</span>
                <span className={`px-2 py-1 rounded text-xs ${ex.success ? "bg-green-600" : "bg-red-600"}`}>
                  {ex.success ? "✓" : "✗"}
                </span>
                <span className="text-slate-400 text-xs">{new Date(ex.started_at).toLocaleString()}</span>
              </div>
              {ex.output && <pre className="text-xs text-slate-300 mt-2 bg-slate-800 p-2 rounded overflow-x-auto">{ex.output}</pre>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}