import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';
import { PaymentTransaction, PaymentTransactionSchema } from '../../schemas/payment-transaction.schema';
import { PaymentPlan, PaymentPlanSchema } from '../../schemas/payment-plan.schema';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: PaymentPlan.name, schema: PaymentPlanSchema },
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
