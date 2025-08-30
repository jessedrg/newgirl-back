import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { PaymentPlan, PaymentPlanSchema } from '../../schemas/payment-plan.schema';
import { PaymentTransaction, PaymentTransactionSchema } from '../../schemas/payment-transaction.schema';
import { UserWallet, UserWalletSchema } from '../../schemas/user-wallet.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfirmoService } from './services/confirmo.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: PaymentPlan.name, schema: PaymentPlanSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ConfirmoService],
  exports: [PaymentsService, ConfirmoService],
})
export class PaymentsModule {}
