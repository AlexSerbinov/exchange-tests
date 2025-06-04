import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ApiClientService } from './services/api-client.service';
import { MarketDataTestService } from './services/market-data-test.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    ApiClientService,
    MarketDataTestService,
  ],
  exports: [
    ApiClientService,
    MarketDataTestService,
  ],
})
export class AppModule {} 