import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  imports: [AuthModule],
  providers: [MessagesRepository, MessagesService],
})
export class MessagesModule {}
