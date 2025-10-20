import React, { useState } from "react";
import { cronToReadable } from "../utils/cronUtils";

interface ScheduleBuilderProps {
  scheduleType: "recurring" | "once";
  onScheduleTypeChange: (type: "recurring" | "once") => void;
  cronExpression: string;
  onCronChange: (cron: string) => void;
  runAt: Date | null;
  onRunAtChange: (date: Date | null) => void;
}

export default function ScheduleBuilder({
  scheduleType,
  onScheduleTypeChange,
  cronExpression,
  onCronChange,
  runAt,
  onRunAtChange
}: ScheduleBuilderProps) {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [runDate, setRunDate] = useState("");
  const [runTime, setRunTime] = useState("");

  function updateCron() {
    const cron = `0 ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    onCronChange(cron);
  }

  function updateRunAt() {
    if (runDate && runTime) {
      onRunAtChange(new Date(`${runDate}T${runTime}`));
    } else {
      onRunAtChange(null);
    }
  }

  React.useEffect(updateCron, [minute, hour, dayOfMonth, month, dayOfWeek]);
  React.useEffect(updateRunAt, [runDate, runTime]);

  return (
    <div className="space-y-3">
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={scheduleType === "recurring"}
            onChange={() => onScheduleTypeChange("recurring")}
          />
          <span>Recurring Schedule</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={scheduleType === "once"}
            onChange={() => onScheduleTypeChange("once")}
          />
          <span>One-time Execution</span>
        </label>
      </div>

      {scheduleType === "recurring" && (
        <div className="bg-slate-700 p-4 rounded space-y-3">
          <h3 className="font-semibold">Build Your Schedule</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Minute</label>
              <input
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                placeholder="* or 0-59"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hour</label>
              <input
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                placeholder="* or 0-23"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day of Month</label>
              <input
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                placeholder="* or 1-31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month</label>
              <input
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                placeholder="* or 1-12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day of Week</label>
              <input
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                placeholder="* or 0-6"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {scheduleType === "once" && (
        <div className="bg-slate-700 p-4 rounded space-y-3">
          <h3 className="font-semibold">Select Date and Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 bg-slate-600 rounded text-sm"
                value={runTime}
                onChange={(e) => setRunTime(e.target.value)}
              />
            </div>
          </div>
          {runAt && (
            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded text-sm">
              Will run once at: <strong>{runAt.toLocaleString()}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
