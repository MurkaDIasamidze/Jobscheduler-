import React from "react";
import JobCard from "./JobCard";

interface JobsListProps {
  token: string;
  jobs: any[];
  onJobUpdated: (job: any) => void;
  onJobDeleted: (jobId: number) => void;
  onRefresh: () => void;
}

export default function JobsList({ token, jobs, onJobUpdated, onJobDeleted, onRefresh }: JobsListProps) {
  return (
    <div className="bg-slate-800 p-6 rounded">
      <h2 className="text-xl font-bold mb-4">Jobs ({jobs.length})</h2>
      {jobs.length === 0 ? (
        <p className="text-slate-400">No jobs created yet.</p>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            token={token}
            onJobUpdated={onJobUpdated}
            onJobDeleted={onJobDeleted}
            onRefresh={onRefresh}
          />
        ))
      )}
    </div>
  );
}