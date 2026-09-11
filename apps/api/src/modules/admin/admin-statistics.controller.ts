import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from '../statistics/statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/stats')
export class AdminStatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Admin overview statistics' })
  async overview() {
    return this.statisticsService.getAdminOverview();
  }

  @Get('growth')
  @ApiOperation({ summary: 'User growth over time' })
  async growth(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('interval') interval?: string,
  ) {
    const validInterval = (interval as 'day' | 'week' | 'month') || 'month';
    return this.statisticsService.getGrowth(from, to, validInterval);
  }

  @Get('questions')
  @ApiOperation({ summary: 'Question bank statistics' })
  async questions(@Query('groupBy') groupBy?: string) {
    const validGroup = (groupBy as 'teacher' | 'subject') || 'teacher';
    return this.statisticsService.getQuestionStats(validGroup);
  }

  @Get('files')
  @ApiOperation({ summary: 'Uploaded files statistics' })
  async files(@Query('groupBy') groupBy?: string) {
    const validGroup = (groupBy as 'teacher') || 'teacher';
    return this.statisticsService.getFileStats(validGroup);
  }
}
