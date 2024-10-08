import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStoreFactory from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration, { API } from './config/configuration';
import { create } from 'apisauce';
import { SkinportService } from './skinport.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { AppMapper } from './app.mapper';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.example'],
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStoreFactory,

        // Store-specific configuration:
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SkinportService,
    PrismaService,
    AppMapper,
    {
      provide: API,
      useFactory: (cs: ConfigService) => {
        return create({
          baseURL: 'https://api.skinport.com/v1/',
          headers: {
            Authorization: `Basic ${btoa(`${cs.get('skinport.client')}:${cs.get('skinport.key')}`)}`,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
