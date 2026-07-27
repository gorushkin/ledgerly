import { describe, expect, it } from "vitest";

import { optionalText, requiredText } from "./baseValidations";

describe("requiredText", () => {
  it("rejects empty text", () => {
    expect(requiredText.safeParse("").success).toBe(false);
  });

  it("rejects whitespace-only text", () => {
    expect(requiredText.safeParse("   ").success).toBe(false);
  });

  it("trims valid text", () => {
    expect(requiredText.parse("  Ledgerly  ")).toBe("Ledgerly");
  });
});

describe("optionalText", () => {
  it("keeps omitted text omitted", () => {
    expect(optionalText.parse(undefined)).toBeUndefined();
  });

  it("allows an explicit empty string", () => {
    expect(optionalText.parse("")).toBe("");
  });
});
