import { describe, expect, it } from "vitest";

import {
  operationUpdateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
} from "./transactions";

const accountId = "00000000-0000-4000-8000-000000000001";
const commodityId = "00000000-0000-4000-8000-000000000002";
const operationId = "00000000-0000-4000-8000-000000000003";

const validOperationCreate = {
  accountId,
  amount: "100",
  value: "100",
};

const validOperationUpdate = {
  ...validOperationCreate,
  description: "Updated operation",
  id: operationId,
};

const validTransactionUpdate = {
  description: "Updated transaction",
  operations: {
    create: [],
    delete: [],
    update: [validOperationUpdate],
  },
  postingDate: "2026-07-27",
  transactionDate: "2026-07-27",
  version: 1,
};

describe("transactionCreateSchema", () => {
  it("defaults omitted transaction and operation descriptions to empty strings", () => {
    expect(
      transactionCreateSchema.parse({
        commodityId,
        operations: [
          validOperationCreate,
          {
            ...validOperationCreate,
            amount: "-100",
            value: "-100",
          },
        ],
        postingDate: "2026-07-27",
        transactionDate: "2026-07-27",
      }),
    ).toMatchObject({
      description: "",
      operations: [{ description: "" }, { description: "" }],
    });
  });
});

describe("transactionUpdateSchema", () => {
  it("requires an explicit transaction description", () => {
    const { description: _description, ...payload } = validTransactionUpdate;

    expect(transactionUpdateSchema.safeParse(payload).success).toBe(false);
  });

  it("requires an explicit updated operation description", () => {
    const { description: _description, ...operation } = validOperationUpdate;

    expect(
      operationUpdateSchema.safeParse({
        ...operation,
      }).success,
    ).toBe(false);
  });

  it("allows explicit empty descriptions to clear them", () => {
    expect(
      transactionUpdateSchema.parse({
        ...validTransactionUpdate,
        description: "",
        operations: {
          ...validTransactionUpdate.operations,
          update: [
            {
              ...validOperationUpdate,
              description: "",
            },
          ],
        },
      }),
    ).toMatchObject({
      description: "",
      operations: {
        update: [{ description: "" }],
      },
    });
  });
});
