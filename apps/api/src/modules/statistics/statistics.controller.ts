import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('admin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin overview statistics' })
  async adminOverview() {
    return this.statisticsService.getAdminOverview();
  }

  @Get('teacher')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Teacher overview statistics' })
  async teacherOverview(@CurrentUser('id') teacherId: string) {
    return this.statisticsService.getTeacherOverview(teacherId);
  }

  @Get('student')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Student overview statistics' })
  async studentOverview(@CurrentUser('id') studentId: string) {
    return this.statisticsService.getStudentOverview(studentId);
  }
}
