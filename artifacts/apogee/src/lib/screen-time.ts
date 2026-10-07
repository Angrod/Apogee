// Screen time is stored in whole minutes and edited in hours.
// Two decimal places of an hour (36 seconds) is enough precision for any
// whole-minute value to round-trip exactly: minutes -> hours -> minutes.

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function formatHours(minutes: number): string {
  return `${minutesToHours(minutes)}h`;
}
