import {
  CommodityCodeString,
  IsoDatetimeString,
  UUID,
} from '@ledgerly/shared/types';

export type CommoditySnapshot = {
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  code: CommodityCodeString;
  symbol: string | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  name: string;
  precision: number;
};

export type CommodityUpdateProps = Partial<{
  code: CommodityCodeString;
  symbol: string | null;
  name: string;
}>;
