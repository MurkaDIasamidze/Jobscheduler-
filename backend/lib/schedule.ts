import cronValidate from 'cron-validate';
import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Validate a schedule (cron string or object schedule)
 */
export function validateSchedule(schedule: any): { valid: boolean; error?: string } {
  if (!schedule) return { valid: false, error: 'Schedule is required' };

  if (typeof schedule === 'string') {
    const result = cronValidate(schedule, { preset: 'default' });
    if (!result.isValid()) {
      return { valid: false, error: result.getError().join('; ') };
    }
    return { valid: true };
  }

  if (typeof schedule === 'object' && schedule !== null) {
    const { years, months, weekdays, daysOfMonth, times } = schedule;

    if (years && (!Array.isArray(years) || years.some(y => typeof y !== 'number'))) {
      return { valid: false, error: 'Years must be an array of numbers' };
    }
    if (months && (!Array.isArray(months) || months.some(m => typeof m !== 'number' || m < 1 || m > 12))) {
      return { valid: false, error: 'Months must be numbers between 1-12' };
    }
    if (weekdays && (!Array.isArray(weekdays) || weekdays.some(w => typeof w !== 'number' || w < 0 || w > 6))) {
      return { valid: false, error: 'Weekdays must be numbers between 0-6' };
    }
    if (daysOfMonth && (!Array.isArray(daysOfMonth) || daysOfMonth.some(d => typeof d !== 'number' || d < 1 || d > 31))) {
      return { valid: false, error: 'DaysOfMonth must be numbers between 1-31' };
    }
    if (times && Array.isArray(times)) {
      for (const time of times) {
        if (!time || typeof time !== 'object') return { valid: false, error: 'Each time must have hour and minute' };
        const { hour, minute } = time;
        if (typeof hour !== 'number' || hour < 0 || hour > 23) return { valid: false, error: 'Hour must be 0-23' };
        if (typeof minute !== 'number' || minute < 0 || minute > 59) return { valid: false, error: 'Minute must be 0-59' };
      }
    }

    return { valid: true };
  }

  return { valid: false, error: 'Schedule must be string or object' };
}

/**
 * Convert schedule (string or object) to DB-safe string
 */
export function toDbSchedule(schedule: any): string {
  if (!schedule) return '';
  if (typeof schedule === 'string') return schedule;
  return JSON.stringify(schedule);
}

/**
 * Parse schedule stored in DB back to original format
 */
export function parseSchedule(schedule: JsonValue): any {
  if (!schedule) return null;

  if (typeof schedule === 'string') {
    try {
      // Attempt to parse JSON, fallback to string
      if (schedule.startsWith('{') || schedule.startsWith('[')) return JSON.parse(schedule);
      return schedule;
    } catch {
      return schedule;
    }
  }

  return schedule;
}
