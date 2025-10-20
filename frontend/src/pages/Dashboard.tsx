import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import CreateJobForm from "../components/CreateJobForm";
import JobsList from "../components/JobsList";
import ExecutionsList from "../components/ExecutionsList";
import { fetchJobs, fetchExecutions } from "../api/api";

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [jobsData, executionsData] = await Promise.all([
        fetchJobs(token),
        fetchExecutions(token)
      ]);
      setJobs(jobsData);
      setExecutions(executionsData);
    } catch (e: any) {
      console.error("[LOAD_DATA] Failed:", e.message);
      if (e.message.includes("401")) {
        onLogout();
      }
    }
  }

  function handleJobCreated(newJob: any) {
    setJobs([newJob, ...jobs]);
  }

  function handleJobUpdated(updatedJob: any) {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
  }

  function handleJobDeleted(jobId: number) {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header onLogout={onLogout} />
        <CreateJobForm token={token} onJobCreated={handleJobCreated} />
        <JobsList 
          token={token} 
          jobs={jobs} 
          onJobUpdated={handleJobUpdated}
          onJobDeleted={handleJobDeleted}
          onRefresh={loadData}
        />
        <ExecutionsList executions={executions} />
      </div>
    </div>
  );
}