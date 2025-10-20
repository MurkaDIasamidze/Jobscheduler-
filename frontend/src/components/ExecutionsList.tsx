import React from "react";

interface ExecutionsListProps {
  executions: any[];
}

export default function ExecutionsList({ executions }: ExecutionsListProps) {
  return (
    <div className="bg-slate-800 p-6 rounded">
      <h2 className="text-xl font-bold mb-4">Executions ({executions.length})</h2>
      {executions.length === 0 ? (
        <p className="text-slate-400">No executions yet.</p>
      ) : (
        executions.slice(0, 10).map((ex) => (
          <div key={ex.id} className="bg-slate-700 p-3 rounded mb-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold">Job {ex.job_id}</span>
              <span className={`px-2 py-1 rounded text-xs ${ex.success ? "bg-green-600" : "bg-red-600"}`}>
                {ex.success ? "✓" : "✗"}
              </span>
              <span className="text-slate-400 text-xs">{new Date(ex.started_at).toLocaleString()}</span>
            </div>
            {ex.output && (
              <pre className="text-xs text-slate-300 mt-2 bg-slate-800 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                {ex.output}
              </pre>
            )}
          </div>
        ))
      )}
    </div>
  );
}
