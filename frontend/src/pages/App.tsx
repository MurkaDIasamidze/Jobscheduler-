import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";


export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  const [jobName, setJobName] = useState("");
  const [command, setCommand] = useState("");
  const [scheduleText, setScheduleText] = useState(
    '{ "times": [{ "hour": 8, "minute": 0 }], "weekdays": [1] }'
  );

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

  async function fetchJobs() {
    try {
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (e) {
      console.error("Fetch jobs error", e);
    }
  }

  async function fetchExecutions() {
    try {
      const res = await axios.get(`${API}/executions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExecutions(res.data);
    } catch (e) {
      console.error("Fetch executions error", e);
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
      alert("Error creating job: " + (e.response?.data?.error || e.message));
    }
  }

  async function toggleJob(id: string, enabled: boolean) {
    try {
      const res = await axios.put(
        `${API}/jobs/update`,
        { id, enabled: !enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, enabled: res.data.enabled } : job
        )
      );
    } catch (e: any) {
      alert("Error toggling job: " + (e.response?.data?.error || e.message));
    }
  }

  async function deleteJob(id: string) {
    try {
      await axios.delete(`${API}/jobs/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id },
      });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e: any) {
      alert("Error deleting job: " + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setJobs([]);
    setExecutions([]);
  }

  if (!token)
    return (
      <div className="p-4 border rounded shadow w-[400px] mx-auto mt-10">
        <h2 className="text-xl font-bold mb-2">Login / Register</h2>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Name (register only)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={login}>
            Login
          </button>
          <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={register}>
            Register
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Job Scheduler</h1>
      {/* Job Creator */}
      <div className="border rounded p-3 mb-4">
        <h2 className="font-semibold mb-2">Create Job</h2>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Job Name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <textarea
          className="border p-2 w-full mb-2"
          rows={3}
          value={scheduleText}
          onChange={(e) => setScheduleText(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={createJob}>
            Create
          </button>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      {/* Jobs */}
      <div className="border rounded p-3 mb-4">
        <h2 className="font-semibold mb-2">Jobs</h2>
        {jobs.map((job) => (
          <div key={job.id} className="border-b py-2 flex justify-between">
            <div>
              <div className="font-semibold">{job.name}</div>
              <div className="text-sm">{job.command}</div>
              <pre className="text-xs">{JSON.stringify(job.schedule, null, 2)}</pre>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded"
                onClick={() => toggleJob(job.id, job.enabled)}
              >
                {job.enabled ? "Disable" : "Enable"}
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => deleteJob(job.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Executions */}
      <div className="border rounded p-3">
        <h2 className="font-semibold mb-2">Executions</h2>
        {executions.map((ex) => (
          <div key={ex.id} className="border-b py-2">
            <div>{ex.job.name}</div>
            <div>Success: {ex.success ? "✅" : "❌"}</div>
            <div>Output: <pre>{ex.output}</pre></div>
            <div className="text-xs">{new Date(ex.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
