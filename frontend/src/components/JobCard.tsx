import React from "react";
import { toggleJob, deleteJob, runJob } from "../api/api";
import { cronToReadable } from "../utils/cronUtils";

interface JobCardProps {
  job: any;
  token: string;
  onJobUpdated: (job: any) => void;
  onJobDeleted: (jobId: number) => void;
  onRefresh: () => void;
}

export default function JobCard({ job, token, onJobUpdated, onJobDeleted, onRefresh }: JobCardProps) {
  async function handleToggle() {
    console.log("[TOGGLE_JOB] Toggling job", job.id);
    try {
      const updated = await toggleJob(token, job.id, job.enabled);
      console.log("[TOGGLE_JOB] Success");
      onJobUpdated(updated);
    } catch (e: any) {
      console.error("[TOGGLE_JOB] Failed:", e.message);
      alert("Toggle failed: " + e.message);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete job?")) return;
    console.log("[DELETE_JOB] Deleting job", job.id);
    try {
      await deleteJob(token, job.id);
      console.log("[DELETE_JOB] Success");
      onJobDeleted(job.id);
      alert("Job deleted!");
    } catch (e: any) {
      console.error("[DELETE_JOB] Failed:", e.message);
      alert("Delete failed: " + e.message);
    }
  }

  async function handleRun() {
    console.log("[RUN_JOB] Running job", job.id);
    try {
      await runJob(token, job.id);
      console.log("[RUN_JOB] Success");
      alert("Job started!");
      setTimeout(onRefresh, 2000);
    } catch (e: any) {
      console.error("[RUN_JOB] Failed:", e.message);
      alert("Error: " + e.message);
    }
  }

  return (
    <div className="bg-slate-700 p-4 rounded mb-3">
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{job.name}</h3>
            <span className={`px-2 py-1 rounded text-xs ${job.enabled ? "bg-green-600" : "bg-gray-600"}`}>
              {job.enabled ? "ON" : "OFF"}
            </span>
            {job.run_at && (
              <span className="px-2 py-1 rounded text-xs bg-purple-600">One-time</span>
            )}
          </div>
          <div className="text-sm text-slate-300 mt-1">
            {job.commands?.map((cmd: string, i: number) => (
              <div key={i} className="font-mono text-xs">{cmd}</div>
            ))}
          </div>
          {job.run_at ? (
            <div className="text-sm text-slate-400 mt-1">
              Runs at: {new Date(job.run_at).toLocaleString()}
            </div>
          ) : (
            <div className="text-sm text-slate-400 mt-1">
              {cronToReadable(job.schedule)}
              <code className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded">{job.schedule}</code>
            </div>
          )}
          {job.last_run_at && (
            <div className="text-xs text-slate-500 mt-1">
              Last run: {new Date(job.last_run_at).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm" onClick={handleRun}>
            Run
          </button>
          <button className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm" onClick={handleToggle}>
            {job.enabled ? "Disable" : "Enable"}
          </button>
          <button className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
