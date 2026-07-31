import { describe, expect, it } from "vitest";

import { commodityQuerySchema } from "./commodities";

describe("commodityQuerySchema", () => {
  it("defaults omitted status filter to active commodities", () => {
    expect(commodityQuerySchema.parse({})).toEqual({ status: "active" });
  });

  it("allows querying all commodities", () => {
    expect(commodityQuerySchema.parse({ status: "all" })).toEqual({
      status: "all",
    });
  });
});
