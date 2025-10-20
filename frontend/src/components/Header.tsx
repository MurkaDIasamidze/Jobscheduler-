import React from "react";

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <div className="flex justify-between items-center bg-slate-800 p-4 rounded">
      <h1 className="text-2xl font-bold">Job Scheduler</h1>
      <button
        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
}