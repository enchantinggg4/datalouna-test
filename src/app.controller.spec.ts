import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AppMapper } from './app.mapper';
import { ItemPriceDataDto } from './dto/item.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;
  let appService: DeepMockProxy<AppService>;

  beforeEach(async () => {
    appService = mockDeep<AppService>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
        AppMapper,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GetItems', () => {
    it('should return empty array', () => {
      appService.getItems.mockResolvedValue([]);

      expect(appController.getItems()).resolves.toStrictEqual([]);
    });

    it('should return array with mapped data', () => {
      appService.getItems.mockResolvedValue([
        {
          market_hash_name: 'Ak47',
          min_price_untradable: 0.43,
          min_price_tradable: 0.47,
        },
      ]);

      expect(appController.getItems()).resolves.toStrictEqual<
        ItemPriceDataDto[]
      >([
        {
          market_hash_name: 'Ak47',
          min_price_untradable: 0.43,
          min_price_tradable: 0.47,
        },
      ]);
    });
  });

  describe('Purchase', () => {
    it(`should return 404 if item doesn't exist`, () => {
      appService.purchaseItem.mockRejectedValue(
        new HttpException('123', HttpStatus.NOT_FOUND),
      );

      expect(
        appController.purchaseItem({
          item_market_hash_name: 'has47',
          user_id: '123',
          tradable: false,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it(`should return purchased item if everything's good`, () => {
      const d = new Date(100000000);

      appService.purchaseItem.mockResolvedValue({
        id: '123',
        userId: '456',
        itemMarketHashName: 'ak47',
        boughtAtPrice: 0.12,
        isTradable: false,
        createdAt: d,
      });

      expect(
        appController.purchaseItem({
          item_market_hash_name: 'ak47',
        } as any),
      ).resolves.toStrictEqual({
        id: '123',
        user_id: '456',
        item_market_hash_name: 'ak47',
        bought_at_price: 0.12,
        tradable: false,
        bought_at: d,
      });
    });
  });
});
