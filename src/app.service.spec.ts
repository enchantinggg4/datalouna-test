import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient, User } from '@prisma/client';
import { AppMapper } from './app.mapper';
import { SkinportService } from './skinport.service';
import { PrismaService } from './prisma.service';
import { ItemNotFoundException } from './exception/item-not-found.exception';

describe('AppService', () => {
  let appService: AppService;
  let prismaMock: DeepMockProxy<PrismaClient>;
  let skinportService: DeepMockProxy<SkinportService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>();
    skinportService = mockDeep<SkinportService>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        AppService,
        AppMapper,
        {
          provide: SkinportService,
          useValue: skinportService,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    appService = app.get<AppService>(AppService);
  });

  describe('getItems', () => {
    it('should ask skinport service for items', () => {
      skinportService.getItems.mockResolvedValue([]);
      expect(appService.getItems()).resolves.toStrictEqual([]);
      expect(skinportService.getItems).toBeCalledTimes(1);
    });
  });

  describe('purchaseItem', () => {
    it(`should fail if item doesn't exist`, () => {
      skinportService.getItem.mockReturnValue(undefined);
      expect(appService.purchaseItem('sdf', 'uid', false)).rejects.toEqual(
        new ItemNotFoundException('sdf'),
      );
      expect(skinportService.getItem).toBeCalledTimes(1);
      expect(skinportService.getItem).toBeCalledWith('sdf');
    });

    it('should create a purchase if everything is fine', () => {
      skinportService.getItem.mockReturnValue({
        min_price_untradable: 0.34,
        min_price_tradable: 0.39,
        market_hash_name: 'ak48',
      });

      // @ts-ignore
      jest
        .spyOn(appService as any, 'getOrCreateUser')
        .mockImplementation(async (uid: string, tx, defaultBalance) => {
          return {
            id: uid,
            balance: 1000,
          } satisfies User;
        });

      // @ts-ignore
      prismaMock.$queryRaw.mockImplementation(() => Promise.resolve());

      // @ts-ignore
      prismaMock.$transaction.mockImplementation((callback) =>
        callback(prismaMock),
      );

      // @ts-ignore
      prismaMock.purchase.create.mockImplementation((d: any) => {
        const { data } = d;
        return {
          userId: data.userId,
          itemMarketHashName: data.itemMarketHashName,
          boughtAtPrice: data.boughtAtPrice,
        };
      });

      expect(appService.purchaseItem('ak48', 'uid', false)).resolves.toEqual({
        userId: 'uid',
        itemMarketHashName: 'ak48',
        boughtAtPrice: 0.34,
      });
    });
  });
});
