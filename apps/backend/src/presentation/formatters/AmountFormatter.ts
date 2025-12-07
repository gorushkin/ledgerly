import { Amount } from '../../domain/domain-core/value-objects/Amount';

export class AmountFormatter {
  private minorToMajor(minorUnits: string): { major: string; minor: string } {
    const isNegative = minorUnits.startsWith('-');
    const absoluteValue = isNegative ? minorUnits.slice(1) : minorUnits;

    const paddedValue = absoluteValue.padStart(3, '0');

    const majorPart = paddedValue.slice(0, -2) || '0';
    const minorPart = paddedValue.slice(-2);

    return {
      major: isNegative ? `-${majorPart}` : majorPart,
      minor: minorPart,
    };
  }

  format(amount: Amount, locale = 'en-US'): string {
    const minorUnits = amount.valueOf();
    const { major, minor } = this.minorToMajor(minorUnits);

    const formattedMajor = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Number(major));

    const decimalSeparator =
      new Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((part) => part.type === 'decimal')?.value ?? '.';

    return `${formattedMajor}${decimalSeparator}${minor}`;
  }

  formatWithCurrency(
    amount: Amount,
    currencyCode: string,
    locale = 'en-US',
  ): string {
    const minorUnits = amount.valueOf();
    const { major, minor } = this.minorToMajor(minorUnits);

    const formatted = new Intl.NumberFormat(locale, {
      currency: currencyCode,
      style: 'currency',
    }).format(Number(`${major}.${minor}`));

    return formatted;
  }

  formatCompact(amount: Amount, locale = 'en-US'): string {
    const minorUnits = amount.valueOf();
    const { major, minor } = this.minorToMajor(minorUnits);

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(Number(`${major}.${minor}`));
  }

  formatForTable(amount: Amount, locale = 'en-US'): string {
    const formatted = this.formatWithSign(amount, locale);
    return formatted.padStart(15);
  }

  formatWithSign(amount: Amount, locale = 'en-US'): string {
    const formatted = this.format(amount, locale);
    const sign = amount.isPositive() ? '+' : '';
    return `${sign}${formatted}`;
  }
}
