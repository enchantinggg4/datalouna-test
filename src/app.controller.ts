import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ItemPriceDataDto, PurchaseItemDto } from './dto/item.dto';
import { AppMapper } from './app.mapper';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('items')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appMapper: AppMapper,
  ) {}

  // Subject to change
  @CacheKey('items_controller_item_list')
  @CacheTTL(60_000)
  @Get('/')
  public async getItems(): Promise<ItemPriceDataDto[]> {
    return this.appService.getItems();
  }

  /**
   * Note: if this is intended as a microservice, passing user id in a dto is acceptable
   * However if its public api, welp, gotta implement authorization
   */
  @Post('/purchase')
  public async purchaseItem(@Body() body: PurchaseItemDto) {
    return this.appService
      .purchaseItem(body.item_market_hash_name, body.user_id, body.tradable)
      .then(this.appMapper.mapPurchase);
  }
}
