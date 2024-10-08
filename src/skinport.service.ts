import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { API } from './config/configuration';
import { ApisauceInstance } from 'apisauce';
import { ItemPriceDataDto, RawItemDto } from './dto/item.dto';
import { Cron } from '@nestjs/schedule';
import { HttpStatusCode } from 'axios';
import { CacheStoreSetOptions } from '@nestjs/cache-manager/dist/interfaces/cache-manager.interface';

@Injectable()
export class SkinportService {
  private static MERGED_ITEMS_CACHE_KEY = 'merged_items';
  private logger = new Logger(SkinportService.name);

  // Our data size is small, only couple megabytes, we can store a duplicate in memory

  private mergedItemData = new Map<string, ItemPriceDataDto>();

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly configService: ConfigService,
    @Inject(API) private api: ApisauceInstance,
  ) {
    if (this.configService.get<boolean>('isTestEnvironment')) return;
    // Initial population of cache
    this.initialItemsPopulation();
  }

  private ttl(): CacheStoreSetOptions<any> {
    return { ttl: this.configService.get<number>('skinport.itemsEndpointTTL') };
  }

  private async initialItemsPopulation() {
    const cached = await this.readDataFromRedis();

    if (this.configService.get<boolean>('isDevelopment') && cached) {
      this.logger.log(
        'Development: skipping skinport sync due to non-empty cache',
      );
      await this.parseRedisPriceData(cached);
      // In development environment we often restart, so to no hit rate limit we don't do population if data is in cache
      return;
    }
    await this.updateSkinportItems();
  }

  // Every five minutes on 30th second( to guarantee we hit a new cache)
  @Cron('30 */5 * * * *')
  private async updateSkinportItems() {
    const [tradableItems, untradableItems] = await Promise.all([
      this.fetchItems(true),
      this.fetchItems(false),
    ]);
    if (!tradableItems || !untradableItems) {
      this.logger.error(
        "Can't merge item data: we failed tradable/untradable fetch",
      );
      return;
    }
    this.mergedItemData = this.mergeItemData(tradableItems, untradableItems);
    await this.storeMergedData(this.mergedItemData);
    this.logger.log('Skinport data updated.');
  }

  private async readDataFromRedis(): Promise<ItemPriceDataDto[] | undefined> {
    return this.cacheManager.get<ItemPriceDataDto[]>(
      SkinportService.MERGED_ITEMS_CACHE_KEY,
    );
  }

  private async parseRedisPriceData(cached: ItemPriceDataDto[]) {
    this.mergedItemData = new Map<string, ItemPriceDataDto>(
      cached.map((it) => [it.market_hash_name, it]),
    );
    this.logger.log('Loaded redis data into memory');
  }

  private async fetchItems(
    tradable: boolean,
    retries = 2,
  ): Promise<RawItemDto[] | undefined> {
    if (retries === -1) return;

    const response = await this.api.get<RawItemDto[]>('/items', { tradable });
    if (response.ok) {
      return response.data;
    }

    // what do we do if api fails?
    switch (response.status) {
      case HttpStatusCode.Unauthorized:
        this.logger.error(
          'Error requesting skinport api: Authorization failed, update SKINPORT_CLIENT_ID and SKINPORT_KEY env parameters ',
        );
        break;
      case HttpStatusCode.TooManyRequests:
        this.logger.warn(
          "We hit rate limit: This shouldn't be happenning: Application restarts too fast or rate limit changed, update cron job @SkinportService",
        );
        break;
      default:
        // Let's try to refetch it a couple of times
        return this.fetchItems(tradable, retries - 1);
    }

    this.logger.error('Failed to update raw item data');
    return undefined;
  }

  // Array.from has almost no overhead
  public async getItems(): Promise<ItemPriceDataDto[]> {
    const items = this.mergedItemData.values();
    return Array.from(items) || [];
  }

  // O(n)
  // To discuss: what to do if skinport returns different size arrays
  private mergeItemData(
    tr: RawItemDto[],
    untr: RawItemDto[],
  ): Map<string, ItemPriceDataDto> {
    const map = new Map<string, ItemPriceDataDto>();

    const m1 = new Map<string, RawItemDto>(
      tr.map((item) => [item.market_hash_name, item]),
    );

    const m2 = new Map<string, RawItemDto>(
      untr.map((item) => [item.market_hash_name, item]),
    );

    for (const value of m1.values()) {
      const untrPair = m2.get(value.market_hash_name);
      if (!untrPair) continue;

      map.set(value.market_hash_name, {
        market_hash_name: value.market_hash_name,
        min_price_tradable: value.min_price,
        min_price_untradable: untrPair.min_price,
      });
    }

    return map;
  }

  private async storeMergedData(mergedItemData: Map<string, ItemPriceDataDto>) {
    const mergedData = Array.from(mergedItemData);

    await this.cacheManager.set(
      SkinportService.MERGED_ITEMS_CACHE_KEY,
      mergedData,
      this.ttl(),
    );
  }

  public getItem(itemMarketHashName: string): ItemPriceDataDto | undefined {
    return this.mergedItemData.get(itemMarketHashName);
  }
}
