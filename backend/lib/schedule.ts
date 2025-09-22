import { JsonValue } from "@prisma/client/runtime/library";
import { cronValidate } from "cron-validate";

export function parseSchedule(val: JsonValue): any {
  if (!val) return null;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export function toDbSchedule(val: any): string {
  if (!val) return "";
  return typeof val === "string" ? val : JSON.stringify(val);
}

export function validateSchedule(schedule: any) {
  if (!schedule) return { valid: false, error: "Schedule required" };

  if (typeof schedule === "string") {
    const result = cronValidate(schedule, { preset: "default" });
    return result.isValid()
      ? { valid: true }
      : { valid: false, error: result.getError().join("; ") };
  }

  if (typeof schedule === "object") {
    if (schedule.times) {
      for (const t of schedule.times) {
        if (typeof t.hour !== "number" || typeof t.minute !== "number") {
          return { valid: false, error: "Each time must have hour & minute" };
        }
      }
    }
    return { valid: true };
  }

  return { valid: false, error: "Invalid schedule format" };
}
