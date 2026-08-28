import { scrubObject } from "@/services/sentry";

describe("scrubObject", () => {
  it("redacts known PII keys at the top level", () => {
    const result = scrubObject({ name: "Jad", weightGrams: 4200 });
    expect(result.name).toBe("[scrubbed]");
    expect(result.weightGrams).toBe(4200);
  });

  it("redacts PII keys nested inside plain objects", () => {
    const result = scrubObject({ baby: { name: "Jad", dateOfBirth: "2026-01-01" }, count: 3 });
    expect((result.baby as Record<string, unknown>).name).toBe("[scrubbed]");
    expect((result.baby as Record<string, unknown>).dateOfBirth).toBe("[scrubbed]");
    expect(result.count).toBe(3);
  });

  it("leaves non-PII fields untouched", () => {
    const result = scrubObject({ screen: "Home", durationSeconds: 600 });
    expect(result).toEqual({ screen: "Home", durationSeconds: 600 });
  });

  it("does not choke on arrays as values", () => {
    const result = scrubObject({ tags: ["a", "b"], note: "private" });
    expect(result.tags).toEqual(["a", "b"]);
    expect(result.note).toBe("[scrubbed]");
  });
});
