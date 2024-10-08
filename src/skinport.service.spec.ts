import { Test, TestingModule } from '@nestjs/testing';
import { SkinportService } from './skinport.service';
import { ItemPriceDataDto, RawItemDto } from './dto/item.dto';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { API } from './config/configuration';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ApisauceInstance } from 'apisauce';
import testConfiguration from './config/testConfiguration';

describe('SkinportService', () => {
  let apiMock: DeepMockProxy<ApisauceInstance>;
  let skinportService: SkinportService;

  beforeEach(async () => {
    apiMock = mockDeep<ApisauceInstance>({
      get: () => Promise.resolve({ ok: true }),
    } as any);

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [testConfiguration],
        }),
      ],
      controllers: [],
      providers: [
        SkinportService,
        {
          provide: API,
          useValue: apiMock,
        },
      ],
    }).compile();

    skinportService = app.get<SkinportService>(SkinportService);
  });

  describe('merge data', () => {
    it('should merge data correctly', () => {
      const tradable: Partial<RawItemDto>[] = [
        {
          min_price: 0.34,
          market_hash_name: 'ak47',
        },
        {
          min_price: 0.14,
          market_hash_name: 'deagle',
        },
      ];

      const untradable: Partial<RawItemDto>[] = [
        {
          min_price: 0.29,
          market_hash_name: 'ak47',
        },
        {
          min_price: 0.09,
          market_hash_name: 'deagle',
        },
      ];
      const merged: Map<string, ItemPriceDataDto> = skinportService[
        'mergeItemData'
      ](tradable as RawItemDto[], untradable as RawItemDto[]);
      const expected: ItemPriceDataDto[] = [
        {
          market_hash_name: 'ak47',
          min_price_tradable: 0.34,
          min_price_untradable: 0.29,
        },
        {
          market_hash_name: 'deagle',
          min_price_tradable: 0.14,
          min_price_untradable: 0.09,
        },
      ];

      expect(Array.from(merged.values())).toStrictEqual(expected);
    });
  });
});
