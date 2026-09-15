import { describe, expect, it } from "bun:test";
import { normalizeDOB } from "./dateUtils";

describe("normalizeDOB", () => {
  it("should normalize YYYY-MM-DD format", () => {
    expect(normalizeDOB("2013-12-30")).toBe("2013-12-30");
    expect(normalizeDOB("2015-01-01")).toBe("2015-01-01");
  });

  it("should normalize YYYY/MM/DD and YYYY.MM.DD formats", () => {
    expect(normalizeDOB("2013/12/30")).toBe("2013-12-30");
    expect(normalizeDOB("2015.01.01")).toBe("2015-01-01");
  });

  it("should normalize DD-MM-YYYY format", () => {
    expect(normalizeDOB("30-12-2013")).toBe("2013-12-30");
    expect(normalizeDOB("01-01-2015")).toBe("2015-01-01");
  });

  it("should normalize DD/MM/YYYY and DD.MM.YYYY formats", () => {
    expect(normalizeDOB("30/12/2013")).toBe("2013-12-30");
    expect(normalizeDOB("01.01.2015")).toBe("2015-01-01");
  });

  it("should normalize D-M-YYYY format with single digit month/day", () => {
    expect(normalizeDOB("5-4-2015")).toBe("2015-04-05");
    expect(normalizeDOB("05-4-2015")).toBe("2015-04-05");
    expect(normalizeDOB("5-04-2015")).toBe("2015-04-05");
  });

  it("should normalize 8-digit numeric strings (DDMMYYYY and YYYYMMDD)", () => {
    expect(normalizeDOB("30122013")).toBe("2013-12-30");
    expect(normalizeDOB("20131230")).toBe("2013-12-30");
  });

  it("should handle whitespace and padded input", () => {
    expect(normalizeDOB("  30-12-2013  ")).toBe("2013-12-30");
  });

  it("should return null for invalid or empty inputs", () => {
    expect(normalizeDOB("")).toBeNull();
    expect(normalizeDOB(null)).toBeNull();
    expect(normalizeDOB("invalid-date")).toBeNull();
    expect(normalizeDOB("31-02-2013")).toBeNull(); // Invalid date in Feb
    expect(normalizeDOB("99-99-9999")).toBeNull();
  });
});
