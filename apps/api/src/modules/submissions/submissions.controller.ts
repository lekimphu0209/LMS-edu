import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { StartSubmissionDto, SubmitSubmissionDto, GradeSubmissionDto } from './dto/submission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('start')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Start a submission (student)' })
  async start(@Body() dto: StartSubmissionDto, @CurrentUser('id') studentId: string) {
    return this.submissionsService.start(dto, studentId);
  }

  @Post(':id/submit')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Submit answers (student)' })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitSubmissionDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.submissionsService.submit(id, dto, studentId);
  }

  @Post(':id/grade')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Grade submission (teacher)' })
  async grade(
    @Param('id') id: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser('id') gradedBy: string,
  ) {
    return this.submissionsService.grade(id, dto, gradedBy);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get submission by ID' })
  async findById(@Param('id') id: string) {
    return this.submissionsService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List submissions by student or target' })
  async findAll(
    @Query('studentId') studentId?: string,
    @Query('assignmentTargetId') assignmentTargetId?: string,
  ) {
    if (studentId) return this.submissionsService.findByStudent(studentId);
    if (assignmentTargetId) return this.submissionsService.findByTarget(assignmentTargetId);
    return [];
  }
}
