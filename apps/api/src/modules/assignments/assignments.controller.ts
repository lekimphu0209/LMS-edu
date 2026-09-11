import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto, CreateAssignmentTargetDto } from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List assignments' })
  async findAll(@Query('createdBy') createdBy?: string) {
    return this.assignmentsService.findAll(createdBy);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID with questions and targets' })
  async findById(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create assignment with questions' })
  async create(@Body() dto: CreateAssignmentDto, @CurrentUser('id') createdBy: string) {
    return this.assignmentsService.create(dto, createdBy);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Update assignment' })
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete assignment' })
  async delete(@Param('id') id: string) {
    return this.assignmentsService.delete(id);
  }

  @Post(':id/targets')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Assign to class or student' })
  async createTarget(@Param('id') id: string, @Body() dto: CreateAssignmentTargetDto) {
    return this.assignmentsService.createTarget(id, dto);
  }

  @Get(':id/submissions')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'List submissions for this assignment' })
  async getSubmissions(@Param('id') id: string) {
    return this.assignmentsService.getSubmissions(id);
  }

  @Get(':id/targets')
  @ApiOperation({ summary: 'Get assignment targets' })
  async getTargets(@Param('id') id: string) {
    return this.assignmentsService.getTargets(id);
  }
}
