import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** PrismaModule — export PrismaService dùng chung cho mọi module nghiệp vụ. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
