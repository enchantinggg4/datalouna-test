export class PurchaseDto {
  id: string;
  user_id: string;
  item_market_hash_name: string;
  bought_at_price: number;
  tradable: boolean;
  bought_at: Date;
}
