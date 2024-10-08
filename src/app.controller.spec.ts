import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SkinportService } from './skinport.service';
import { PrismaService } from './prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient, Purchase } from '@prisma/client';
import { AppMapper } from './app.mapper';
import { ItemPriceDataDto, UserId } from './dto/item.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let skinportMock: DeepMockProxy<SkinportService>;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>();
    skinportMock = mockDeep<SkinportService>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        AppMapper,
        {
          provide: SkinportService,
          useValue: skinportMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('GetItems', () => {
    it('should return empty array', () => {
      jest
        .spyOn(appService, 'getItems')
        .mockImplementation(() => Promise.resolve([]));

      expect(appController.getItems()).resolves.toStrictEqual([]);
    });

    it('should return array with mapped data', () => {
      jest.spyOn(appService, 'getItems').mockImplementation(() =>
        Promise.resolve<ItemPriceDataDto[]>([
          {
            market_hash_name: 'Ak47',
            min_price_untradable: 0.43,
            min_price_tradable: 0.47,
          },
        ]),
      );

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
      jest.spyOn(appService, 'purchaseItem').mockImplementation(() => {
        throw new HttpException('123', HttpStatus.NOT_FOUND);
      });

      expect(
        appController.purchaseItem({
          item_market_hash_name: 'has47',
        } as any),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it(`should return purchased item if everything's good`, () => {
      const d = new Date(100000000);

      jest
        .spyOn(appService, 'purchaseItem')
        .mockImplementation(
          (itemMarketHashName: string, userId: UserId, tradable: boolean) => {
            const r: Purchase & any = {
              id: '123',
              userId: '456',
              itemMarketHashName: 'ak47',
              boughtAtPrice: 0.12,
              isTradable: false,
              createdAt: d,
            };

            return Promise.resolve(r);
          },
        );

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
      });
    });
  });
});
