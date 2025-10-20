export function cronToReadable(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 6) return cron;
  
  const [sec, min, h, d, m, dow] = parts;
  const readable: string[] = [];
  
  if (min === "*" && h === "*" && d === "*" && m === "*" && dow === "*") {
    return "Every minute";
  }
  if (min.startsWith("*/")) {
    readable.push(`Every ${min.substring(2)} minutes`);
  } else if (min !== "*") {
    readable.push(`At minute ${min}`);
  }
  if (h.startsWith("*/")) {
    readable.push(`every ${h.substring(2)} hours`);
  } else if (h !== "*") {
    readable.push(`at ${h}:00`);
  }
  if (d !== "*") readable.push(`on day ${d}`);
  if (m !== "*") readable.push(`in month ${m}`);
  if (dow !== "*") readable.push(`on weekday ${dow}`);
  
  return readable.length > 0 ? readable.join(", ") : "Custom schedule";
}