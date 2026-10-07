import { describe, expect, it } from "vitest";
import { formatHours, hoursToMinutes, minutesToHours } from "./screen-time";

describe("screen time conversion", () => {
  it("round-trips every whole minute in a day exactly", () => {
    for (let minutes = 0; minutes <= 1440; minutes++) {
      expect(hoursToMinutes(minutesToHours(minutes))).toBe(minutes);
    }
  });

  it("stores 1.5 hours as 90 minutes and 1.25 hours as 75", () => {
    expect(hoursToMinutes(1.5)).toBe(90);
    expect(hoursToMinutes(1.25)).toBe(75);
  });

  it("formats without losing quarter hours", () => {
    expect(formatHours(75)).toBe("1.25h");
    expect(formatHours(90)).toBe("1.5h");
    expect(formatHours(60)).toBe("1h");
  });
});
