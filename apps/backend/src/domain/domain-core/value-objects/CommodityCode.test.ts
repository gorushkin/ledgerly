import { InvalidCommodityCodeError } from 'src/domain';
import { describe, expect, it } from 'vitest';

import { CommodityCode } from './CommodityCode';

describe('CommodityCode Value Object', () => {
  describe('create method', () => {
    it('should create valid commodity code', () => {
      const commodityCode = CommodityCode.create('CMD');

      expect(commodityCode.valueOf()).toBe('CMD');
    });

    it('should normalize commodity code to uppercase', () => {
      const commodityCode = CommodityCode.create('cmd');

      expect(commodityCode.valueOf()).toBe('CMD');
    });

    it('should trim whitespace', () => {
      const commodityCode = CommodityCode.create('  CMD  ');

      expect(commodityCode.valueOf()).toBe('CMD');
    });

    it('should throw error for invalid commodity codes', () => {
      const invalidCodes = [
        '',
        ' ',
        '   ',
        'US',
        '123',
        '1USD',
        'USD EUR',
        ' USD EUR ',
        'USD!',
        'USD$',
        'USD.',
        'USD,',
        'USD/',
        'USD\\',
        'USD@',
        'USD#',
        '_USD',
        '-USD',
        'РУБ',
        '€',
        'ドル',
        'QWERTYUIOPASDFGHJ',
      ];

      invalidCodes.forEach((invalidCode) => {
        expect(() => CommodityCode.create(invalidCode)).toThrow(
          InvalidCommodityCodeError,
        );
      });
    });

    it('should accept valid commodity codes', () => {
      const validCodes = [
        'CMD',
        'USD',
        'EUR',
        'JPY',
        'GBP',
        'AUD',
        'CAD',
        'CHF',
        'CNY',
        'SEK',
        'RUB',
        'BTC',
        'ETH',
        'XAU',
        'BONUS',
        'WORKHOURS',
        'USD1',
        'ABC123',
        'usd',
        ' UsD ',
        'QWERTYUIOPASDFGH',
      ];

      validCodes.forEach((validCode) => {
        expect(() => CommodityCode.create(validCode)).not.toThrow();
      });
    });
  });
});
