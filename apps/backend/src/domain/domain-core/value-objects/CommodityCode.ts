import { CommodityCodeString } from '@ledgerly/shared/types';
import { commodityCode } from '@ledgerly/shared/validation';
import { InvalidCommodityCodeError } from 'src/domain';

import { parseValueObject } from './parseValueObject';

const parseCommodityCode = (code: string): CommodityCodeString => {
  return parseValueObject(code, commodityCode, (cause, invalidValue) => {
    throw new InvalidCommodityCodeError(invalidValue, cause);
  });
};

export class CommodityCode {
  private constructor(private readonly code: CommodityCodeString) {
    Object.freeze(this);
  }

  static create(code: string): CommodityCode {
    const normalizedCode = parseCommodityCode(code);
    return new CommodityCode(normalizedCode);
  }

  static restore(code: string): CommodityCode {
    return new CommodityCode(parseCommodityCode(code));
  }

  equals(other: CommodityCode): boolean {
    return this.code === other.code;
  }

  valueOf(): CommodityCodeString {
    return this.code;
  }
}
