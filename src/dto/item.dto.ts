import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export type UserId = string;

export class RawItemDto {
  market_hash_name: string;
  currency: string;
  suggested_price: number;
  item_page: string;
  market_page: string;
  min_price: number;
  max_price: number;
  mean_price: number;
  quantity: number;
  created_at: number;
  updated_at: number;
}

export class ItemPriceDataDto {
  market_hash_name: string;
  min_price_tradable: number;
  min_price_untradable: number;
}

export class PurchaseItemDto {
  @IsString()
  item_market_hash_name: string;

  @IsString()
  user_id: UserId;
  
  @IsBoolean()
  tradable: boolean;
}
