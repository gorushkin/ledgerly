import { Amount } from '../../domain/domain-core/value-objects/Amount';

export class AmountFormatter {
  format(amount: Amount, locale = 'en-US'): string {
    const minorUnits = BigInt(amount.valueOf());
    const major = Number(minorUnits) / 100;

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(major);
  }

  formatWithCurrency(
    amount: Amount,
    currencyCode: string,
    locale = 'en-US',
  ): string {
    const minorUnits = BigInt(amount.valueOf());
    const major = Number(minorUnits) / 100;

    return new Intl.NumberFormat(locale, {
      currency: currencyCode,
      style: 'currency',
    }).format(major);
  }

  formatCompact(amount: Amount, locale = 'en-US'): string {
    const minorUnits = BigInt(amount.valueOf());
    const major = Number(minorUnits) / 100;

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(major);
  }

  formatForTable(amount: Amount, locale = 'en-US'): string {
    const formatted = this.formatWithSign(amount, locale);
    return formatted.padStart(15);
  }

  formatWithSign(amount: Amount, locale = 'en-US'): string {
    const formatted = this.format(amount, locale);
    const sign = amount.isPositive() ? ' ' : '';
    return `${sign}${formatted}`;
  }
}
