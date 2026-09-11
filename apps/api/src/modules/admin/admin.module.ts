import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminClassesController } from './admin-classes.controller';
import { AdminStatisticsController } from './admin-statistics.controller';

@Module({
  imports: [UsersModule, ClassesModule, StatisticsModule],
  controllers: [AdminUsersController, AdminClassesController, AdminStatisticsController],
})
export class AdminModule {}
