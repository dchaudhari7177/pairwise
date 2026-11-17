import { describe, expect, it } from "vitest";
import { addDays, ageFrom, istDay, istDayStart, isoWeek } from "@/lib/time";

describe("IST calendar helpers", () => {
  it("rolls the day over at IST midnight, not UTC midnight", () => {
    // 2026-11-17 18:29 UTC is 23:59 IST; one minute later is the next IST day.
    expect(istDay(Date.parse("2026-11-17T18:29:00Z"))).toBe("2026-11-17");
    expect(istDay(Date.parse("2026-11-17T18:31:00Z"))).toBe("2026-11-18");
  });

  it("round-trips day starts and adds days across month ends", () => {
    expect(istDay(istDayStart("2026-11-30"))).toBe("2026-11-30");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("computes age with the birthday boundary", () => {
    const now = Date.parse("2026-11-17T06:00:00Z");
    expect(ageFrom("2000-11-17", now)).toBe(26);
    expect(ageFrom("2000-11-18", now)).toBe(25);
    expect(ageFrom("2008-11-18", now)).toBe(17);
  });

  it("produces ISO week keys", () => {
    expect(isoWeek(Date.parse("2026-11-17T06:00:00Z"))).toBe("2026-W47");
    expect(isoWeek(Date.parse("2027-01-01T06:00:00Z"))).toBe("2026-W53");
  });
});
