import { Injectable } from '@nestjs/common';
import { Purchase } from '@prisma/client';
import { PurchaseDto } from './dto/purchase.dto';

@Injectable()
export class AppMapper {
  public mapPurchase = (purchase: Purchase): PurchaseDto => {
    return {
      id: purchase.id,
      user_id: purchase.userId,
      item_market_hash_name: purchase.itemMarketHashName,
      bought_at_price: purchase.boughtAtPrice,
      tradable: purchase.isTradable
    };
  };
}
