import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateMyFeedbackDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@Controller('students/me')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('classes')
  @ApiOperation({ summary: 'My enrolled classes with progress and stats' })
  async getMyClasses(@CurrentUser('id') studentId: string) {
    return this.studentsService.getMyClasses(studentId);
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Class detail: info + curriculum + assignments (student view)' })
  async getMyClass(@Param('id') id: string, @CurrentUser('id') studentId: string) {
    return this.studentsService.getMyClass(id, studentId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'My assignments (filter: status=pending|done, classId)' })
  async getMyAssignments(
    @CurrentUser('id') studentId: string,
    @Query('status') status?: string,
    @Query('classId') classId?: string,
  ) {
    return this.studentsService.getMyAssignments(studentId, status, classId);
  }

  @Get('assignments/:id/quiz')
  @ApiOperation({ summary: 'Get quiz questions for an assignment (no correct answers)' })
  async getQuiz(@Param('id') id: string, @CurrentUser('id') studentId: string) {
    return this.studentsService.getQuiz(id, studentId);
  }

  @Get('feedbacks')
  @ApiOperation({ summary: 'My feedback history' })
  async getMyFeedbacks(@CurrentUser('id') studentId: string) {
    return this.studentsService.getMyFeedbacks(studentId);
  }

  @Post('feedbacks')
  @ApiOperation({ summary: 'Create feedback to teacher' })
  async createFeedback(@Body() dto: CreateMyFeedbackDto, @CurrentUser('id') studentId: string) {
    return this.studentsService.createFeedback(dto, studentId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'My dashboard stats' })
  async getMyStats(@CurrentUser('id') studentId: string) {
    return this.studentsService.getMyStats(studentId);
  }
}
