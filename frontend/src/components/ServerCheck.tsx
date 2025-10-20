import React from "react";

interface ServerCheckProps {
  status: "checking" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}

export default function ServerCheck({ status, errorMessage, onRetry }: ServerCheckProps) {
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Connecting to Server...</h2>
          <p className="text-slate-400">Please wait while we check the backend connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-red-900/20 border-2 border-red-500 rounded-lg text-white">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">Server Connection Failed</h2>
          <p className="text-slate-300 mb-4">{errorMessage}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded text-sm mb-4">
          <p className="font-bold mb-2">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Ensure the backend server is running</li>
            <li>Check DATABASE_URL is configured</li>
            <li>Verify database is accessible</li>
            <li>Check server logs for errors</li>
          </ul>
        </div>
        <button
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium transition"
          onClick={onRetry}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}