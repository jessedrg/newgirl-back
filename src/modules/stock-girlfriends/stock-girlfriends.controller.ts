import { Controller } from '@nestjs/common';
import { StockGirlfriendsService } from './stock-girlfriends.service';

@Controller('stock-girlfriends')
export class StockGirlfriendsController {
  constructor(private readonly stockGirlfriendsService: StockGirlfriendsService) {}
}
