import { Module } from '@nestjs/common';
import { StockGirlfriendsController } from './stock-girlfriends.controller';
import { StockGirlfriendsService } from './stock-girlfriends.service';

@Module({
  controllers: [StockGirlfriendsController],
  providers: [StockGirlfriendsService],
  exports: [StockGirlfriendsService],
})
export class StockGirlfriendsModule {}
