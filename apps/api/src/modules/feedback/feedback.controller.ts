import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeedbackService, CreateFeedbackDto, CreateStudentFeedbackDto } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Add teacher feedback to submission' })
  async create(@Body() dto: CreateFeedbackDto, @CurrentUser('id') teacherId: string) {
    return this.feedbackService.create(dto, teacherId);
  }

  @Get(':submissionId')
  @ApiOperation({ summary: 'Get feedback for a submission' })
  async findBySubmission(@Param('submissionId') submissionId: string) {
    return this.feedbackService.findBySubmission(submissionId);
  }

  @Post('student')
  @Roles('STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Student creates feedback' })
  async createStudentFeedback(
    @Body() data: CreateStudentFeedbackDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.feedbackService.createStudentFeedback({ ...data, studentId });
  }

  @Get('inbox')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get feedback inbox for teacher' })
  async getInbox(
    @Query('isRead') isRead?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.feedbackService.findInbox({ isRead, studentId });
  }

  @Patch(':id/read')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Mark feedback as read' })
  async markRead(
    @Param('id') id: string,
    @Body('isRead') isRead: boolean,
  ) {
    return this.feedbackService.markRead(id, isRead);
  }
}
