import { describe, expect, it } from "vitest";
import { buildRows, guessMapping } from "../src/lib/import";
import { inferSource } from "../src/lib/source";
import { formatDay, isoDate, parseLooseDate } from "../src/lib/dates";

describe("guessMapping", () => {
  it("matches common header spellings", () => {
    const m = guessMapping(["First Name", "Last_Name", "E-mail", "Organization", "Job Title", "Lead Source", "Follow-up Date", "Last Contacted"]);
    expect(m).toEqual({
      firstName: "First Name",
      lastName: "Last_Name",
      email: "E-mail",
      company: "Organization",
      role: "Job Title",
      source: "Lead Source",
      nextStepDate: "Follow-up Date",
      lastTouchDate: "Last Contacted",
    });
  });

  it("leaves unknown headers unmapped", () => {
    expect(guessMapping(["Favourite colour"])).toEqual({});
  });
});

describe("buildRows", () => {
  const mapping = guessMapping(["Name", "Email", "Company", "Source", "Next step date", "Last contacted", "Contacted via"]);

  it("normalizes values and skips blanks and duplicates", () => {
    const { rows, skipped } = buildRows(
      [
        { Name: "Ada Lovelace", Email: "ADA@Example.com ", Company: "Analytical", Source: "Website form", "Next step date": "10/14/2026", "Last contacted": "2026-10-01", "Contacted via": "LinkedIn DM" },
        { Name: "", Email: "", Company: "", Source: "", "Next step date": "", "Last contacted": "", "Contacted via": "" },
        { Name: "Ada again", Email: "ada@example.com", Company: "", Source: "", "Next step date": "", "Last contacted": "", "Contacted via": "" },
        { Name: "", Email: "", Company: "Orphan Inc", Source: "", "Next step date": "", "Last contacted": "", "Contacted via": "" },
        { Name: "", Email: "grace@example.com", Company: "", Source: "intro from Sam", "Next step date": "", "Last contacted": "Oct 2, 2026", "Contacted via": "website" },
      ],
      mapping,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "Analytical",
      source: "website",
      nextStepDate: "2026-10-14",
      lastTouchDate: "2026-10-01",
      lastTouchChannel: "linkedin",
    });
    // Falls back to the email as the name; a non-outbound channel becomes email.
    expect(rows[1]).toMatchObject({ name: "grace@example.com", source: "referral", lastTouchChannel: "email" });
    expect(skipped).toEqual([
      { line: 4, reason: "Duplicate email ada@example.com" },
      { line: 5, reason: "No name or email" },
    ]);
  });

  it("joins first and last name", () => {
    const m = guessMapping(["First", "Last"]);
    expect(buildRows([{ First: "Grace", Last: "Hopper" }], m).rows[0].name).toBe("Grace Hopper");
  });
});

describe("inferSource", () => {
  it("maps first touches to a contact source", () => {
    expect(inferSource("outbound", "linkedin")).toBe("outbound");
    expect(inferSource("inbound", "website")).toBe("website");
    expect(inferSource("inbound", "referral")).toBe("referral");
    expect(inferSource("inbound", "email")).toBe("email");
    expect(inferSource("inbound", "call")).toBe("other");
  });
});

describe("dates", () => {
  it("parses loose formats", () => {
    expect(parseLooseDate("2026-10-07")).toBe("2026-10-07");
    expect(parseLooseDate("1/5/26")).toBe("2026-01-05");
    expect(parseLooseDate("not a date")).toBeNull();
    expect(parseLooseDate("")).toBeNull();
  });

  it("computes today in the app timezone", () => {
    // 02:00 UTC on Oct 8 is still Oct 7 in New York.
    expect(isoDate(new Date("2026-10-08T02:00:00Z"), "America/New_York")).toBe("2026-10-07");
  });

  it("formats days", () => {
    expect(formatDay("2026-10-07", "2026-12-01")).toBe("Oct 7");
    expect(formatDay("2025-10-07", "2026-12-01")).toBe("Oct 7, 2025");
  });
});
