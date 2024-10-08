import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SkinportService } from './skinport.service';
import { ItemPriceDataDto, UserId } from './dto/item.dto';
import { PrismaService } from './prisma.service';
import { Purchase, User } from '@prisma/client';

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

    let existingUser: User = await this.prisma.user
      .findUnique({
        where: {
          id: userId,
        },
      })
      .then();

    if (!existingUser) {
      existingUser = await this.prisma.user
        .create({
          data: {
            id: userId,
            balance: 10000,
          },
        })
        .then();
    }

    const price = tradable
      ? item.min_price_tradable
      : item.min_price_untradable;

    // For now lets think price only consists of item price
    if (existingUser.balance < price) {
      throw new HttpException('Not enough funds', HttpStatus.PAYMENT_REQUIRED);
    }

    // we're good and can buy things

    console.log(tradable)
    const [purchase] = await this.prisma.$transaction([
      this.prisma.purchase.create({
        data: {
          userId: existingUser.id,
          itemMarketHashName,
          boughtAtPrice: price,
          isTradable: tradable,
        },
      }),
      this.prisma.user.update({
        data: { ...existingUser, balance: existingUser.balance - price },
        where: {
          id: existingUser.id,
        },
      }),
    ]);

    return purchase;
  }
}
