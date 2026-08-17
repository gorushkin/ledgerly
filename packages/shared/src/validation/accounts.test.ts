import { describe, expect, it } from "vitest";

import {
  accountCreateSchema,
  accountQuerySchema,
  accountUpdateSchema,
} from "./accounts";

const validCreateAccount = {
  commodityId: "00000000-0000-4000-8000-000000000000",
  name: "Checking",
  type: "asset",
};

describe("accountCreateSchema", () => {
  it("defaults omitted description to an empty string", () => {
    expect(accountCreateSchema.parse(validCreateAccount)).toEqual({
      ...validCreateAccount,
      description: "",
    });
  });
});

describe("accountUpdateSchema", () => {
  it("does not default omitted description", () => {
    expect(accountUpdateSchema.parse({ name: "Checking" })).toEqual({
      name: "Checking",
    });
  });

  it("allows an explicit empty description to clear the field", () => {
    expect(accountUpdateSchema.parse({ description: "" })).toEqual({
      description: "",
    });
  });

  it("requires at least one field for update", () => {
    const result = accountUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected empty account update to fail validation");
    }

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        message: "At least one field must be provided for update",
        path: [],
      }),
    );
  });
});

describe("accountQuerySchema", () => {
  it("defaults omitted status filter to open accounts", () => {
    expect(accountQuerySchema.parse({})).toEqual({ status: "open" });
  });

  it("allows querying all accounts", () => {
    expect(accountQuerySchema.parse({ status: "all" })).toEqual({
      status: "all",
    });
  });

  it("allows querying closed accounts", () => {
    expect(accountQuerySchema.parse({ status: "closed" })).toEqual({
      status: "closed",
    });
  });
});
