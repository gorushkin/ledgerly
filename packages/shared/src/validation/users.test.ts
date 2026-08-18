import { describe, expect, it } from "vitest";

import { usersCreateSchema, usersUpdateSchema } from "./users";

describe("usersCreateSchema", () => {
  it("trims and lowercases email before validating email format", () => {
    const result = usersCreateSchema.parse({
      email: "  Test.User@Example.COM  ",
      name: "Test User",
      password: "password123",
    });

    expect(result.email).toBe("test.user@example.com");
  });
});

describe("usersUpdateSchema", () => {
  it("trims and lowercases email before validating email format", () => {
    const result = usersUpdateSchema.parse({
      email: "  Test.User@Example.COM  ",
    });

    expect(result.email).toBe("test.user@example.com");
  });
});
