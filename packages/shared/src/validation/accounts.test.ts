import { describe, expect, it } from "vitest";

import {
  accountCreateSchema,
  accountQuerySchema,
  accountUpdateSchema,
} from "./accounts";

const validCreateAccount = {
  commodityId: "00000000-0000-4000-8000-000000000000",
  initialBalance: "0",
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
});
