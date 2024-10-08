import { Injectable } from '@nestjs/common';
import { SkinportService } from './skinport.service';
import { ItemPriceDataDto, UserId } from './dto/item.dto';
import { PrismaService } from './prisma.service';
import { Prisma, PrismaClient, Purchase, User } from '@prisma/client';
import { ItemNotFoundException } from './exception/item-not-found.exception';
import { NotEnoughFundsException } from './exception/not-enough-funds.exception';
import * as runtime from '@prisma/client/runtime/library';

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
    if (!item) throw new ItemNotFoundException(itemMarketHashName);

    return this.prisma.$transaction(
      async (tx) => {
        const user = await this.getOrCreateUser(userId, tx);
        const price = tradable
          ? item.min_price_tradable
          : item.min_price_untradable;

        // For now lets think price only consists of item price
        if (user.balance < price) {
          throw new NotEnoughFundsException();
        }

        // we're good and can buy things

        await tx.$queryRaw`UPDATE "User" SET balance = balance - ${price} WHERE id = ${user.id}`.then();

        return tx.purchase.create({
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

  private async getOrCreateUser(
    uid: string,
    tx: PrismaClient | Omit<PrismaClient, runtime.ITXClientDenyList> = this
      .prisma,
    defaultBalance: number = 0,
  ): Promise<User> {
    return tx.user
      .upsert({
        where: {
          id: uid,
        },
        update: {},
        create: {
          id: uid,
          balance: defaultBalance,
        },
      })
      .then();
  }
}
