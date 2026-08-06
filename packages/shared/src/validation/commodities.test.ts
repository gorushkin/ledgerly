import { describe, expect, it } from "vitest";

import { commodityQuerySchema } from "./commodities";

describe("commodityQuerySchema", () => {
  it("defaults omitted status filter to open commodities", () => {
    expect(commodityQuerySchema.parse({})).toEqual({ status: "open" });
  });

  it("allows querying closed commodities", () => {
    expect(commodityQuerySchema.parse({ status: "closed" })).toEqual({
      status: "closed",
    });
  });

  it("allows querying all commodities", () => {
    expect(commodityQuerySchema.parse({ status: "all" })).toEqual({
      status: "all",
    });
  });
});
