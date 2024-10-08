import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SkinportService } from './skinport.service';
import { ItemPriceDataDto, UserId } from './dto/item.dto';
import { PrismaService } from './prisma.service';
import { Prisma, Purchase, User } from '@prisma/client';

@Injectable()
export class AppService {
  constructor(
    private readonly skinportService: SkinportService,
    private readonly prisma: PrismaService,
  ) {}

  public async getItems(): Promise<ItemPriceDataDto[]> {
    return this.skinportService.getItems();
  }

  public async purchaseItem(
    itemMarketHashName: string,
    userId: UserId,
    tradable: boolean,
  ): Promise<Purchase> {
    const item = this.skinportService.getItem(itemMarketHashName);
    if (!item) throw new HttpException('Item not found', HttpStatus.NOT_FOUND);

    return this.prisma.$transaction(
      async (tx) => {
        const user: User = await tx.user
          .upsert({
            where: {
              id: userId,
            },
            update: {},
            create: {
              id: userId,
              balance: 10000,
            },
          })
          .then();

        const price = tradable
          ? item.min_price_tradable
          : item.min_price_untradable;

        // For now lets think price only consists of item price
        if (user.balance < price) {
          throw new HttpException(
            'Not enough funds',
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        // we're good and can buy things

        this.prisma
          .$queryRaw`UPDATE "User" SET balance = balance - ${price} WHERE id = ${user.id}`.then();

        return this.prisma.purchase.create({
          data: {
            userId: user.id,
            itemMarketHashName,
            boughtAtPrice: price,
            isTradable: tradable,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
