import { CurrencyCode } from '@ledgerly/shared/types';
import { currencyCode } from '@ledgerly/shared/validation';

const SUPPORTED_CODES = new Set<CurrencyCode>([
  'USD' as CurrencyCode,
  'EUR' as CurrencyCode,
  'GBP' as CurrencyCode,
  'RUB' as CurrencyCode,
]);

export class Currency {
  private readonly code: CurrencyCode;

  private constructor(code: CurrencyCode) {
    this.code = code;
    Object.freeze(this);
  }

  static create(raw: string): Currency {
    const normalized = raw.trim().toUpperCase();
    const parsed = currencyCode.parse(normalized); // throws on invalid format
    return new Currency(parsed);
  }

  static fromPersistence(codeStr: string): Currency {
    const parsed = currencyCode.parse(codeStr);
    return new Currency(parsed);
  }

  isEqualTo(other: Currency): boolean {
    return this.code === other.code;
  }

  valueOf(): CurrencyCode {
    return this.code;
  }

  toPersistence(): CurrencyCode {
    return this.code;
  }

  static isSupported(codeOrCurrency: string | Currency): boolean {
    const code =
      typeof codeOrCurrency === 'string'
        ? codeOrCurrency.toUpperCase()
        : codeOrCurrency.valueOf();
    return SUPPORTED_CODES.has(code as CurrencyCode);
  }
}
