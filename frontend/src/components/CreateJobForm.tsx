import React, { useState } from "react";
import ScheduleBuilder from "./ScheduleBuilder";
import { createJob } from "../api/api";

interface CreateJobFormProps {
  token: string;
  onJobCreated: (job: any) => void;
}

export default function CreateJobForm({ token, onJobCreated }: CreateJobFormProps) {
  const [jobName, setJobName] = useState("");
  const [command, setCommand] = useState("");
  const [scheduleType, setScheduleType] = useState<"recurring" | "once">("recurring");
  const [cronExpression, setCronExpression] = useState("0 * * * * *");
  const [runAt, setRunAt] = useState<Date | null>(null);

  async function handleCreate() {
    if (!jobName || !command) {
      return alert("Fill all fields");
    }

    if (scheduleType === "once" && !runAt) {
      return alert("Please select date and time");
    }

    if (scheduleType === "once" && runAt && runAt <= new Date()) {
      return alert("Run time must be in the future");
    }

    console.log("[CREATE_JOB] Creating job:", { jobName, scheduleType });
    try {
      const commands = command.split("\n").filter(c => c.trim());
      const payload: any = {
        name: jobName,
        commands,
        enabled: true
      };

      if (scheduleType === "once") {
        payload.run_at = runAt?.toISOString();
        payload.schedule = "0 0 0 1 1 *";
      } else {
        payload.schedule = cronExpression;
      }

      const newJob = await createJob(token, payload);
      console.log("[CREATE_JOB] Success:", newJob);
      onJobCreated(newJob);
      setJobName("");
      setCommand("");
      alert("Job created!");
    } catch (e: any) {
      console.error("[CREATE_JOB] Failed:", e.message);
      alert("Error: " + e.message);
    }
  }

  return (
    <div className="bg-slate-800 p-6 rounded space-y-4">
      <h2 className="text-xl font-bold">Create Job</h2>
      
      <input
        className="w-full px-4 py-2 bg-slate-700 rounded"
        placeholder="Job Name"
        value={jobName}
        onChange={(e) => setJobName(e.target.value)}
      />
      
      <textarea
        className="w-full px-4 py-2 bg-slate-700 rounded h-20"
        placeholder="Commands (one per line)"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />

      <ScheduleBuilder
        scheduleType={scheduleType}
        onScheduleTypeChange={setScheduleType}
        cronExpression={cronExpression}
        onCronChange={setCronExpression}
        runAt={runAt}
        onRunAtChange={setRunAt}
      />

      <button
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
        onClick={handleCreate}
      >
        Create Job
      </button>
    </div>
  );
}