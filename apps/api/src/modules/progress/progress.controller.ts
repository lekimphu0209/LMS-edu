import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('snapshots')
  @ApiOperation({ summary: 'Get progress snapshots for a student' })
  async getSnapshots(
    @Query('studentId') studentId?: string,
    @Query('curriculumId') curriculumId?: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.progressService.getSnapshots(studentId || currentUserId!, curriculumId);
  }

  @Post('sessions/start')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Start a learning session' })
  async startSession(
    @CurrentUser('id') studentId: string,
    @Body('assignmentTargetId') assignmentTargetId?: string,
  ) {
    return this.progressService.startLearningSession(studentId, assignmentTargetId);
  }

  @Post('sessions/:id/end')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'End a learning session' })
  async endSession(@Param('id') id: string) {
    return this.progressService.endLearningSession(id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get learning sessions' })
  async getSessions(
    @Query('studentId') studentId?: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.progressService.getLearningSessions(studentId || currentUserId!);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Get milestones' })
  async getMilestones(
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.progressService.getMilestones(studentId, classId);
  }

  @Post('milestones')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create a milestone' })
  async createMilestone(
    @Body() data: { studentId: string; classId?: string; title: string; description?: string; milestoneDate?: string },
    @CurrentUser('id') createdBy: string,
  ) {
    return this.progressService.createMilestone({ ...data, createdBy });
  }

  @Delete('milestones/:id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete a milestone' })
  async deleteMilestone(@Param('id') id: string) {
    return this.progressService.deleteMilestone(id);
  }
}
