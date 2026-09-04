import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, EnrollStudentsDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List classes (admin: all, teacher: own classes)' })
  async findAll(
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.classesService.findAll(teacherId, status, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  async findById(@Param('id') id: string) {
    return this.classesService.findById(id);
  }

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new class' })
  async create(@Body() dto: CreateClassDto, @CurrentUser('id') createdBy: string) {
    return this.classesService.create(dto, createdBy);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update class' })
  async update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Deactivate class' })
  async deactivate(@Param('id') id: string) {
    return this.classesService.deactivate(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get enrolled students' })
  async getStudents(@Param('id') id: string) {
    return this.classesService.getStudents(id);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get assignments for this class' })
  async getAssignments(@Param('id') id: string) {
    return this.classesService.getAssignments(id);
  }

  @Post(':id/students')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Enroll students into class' })
  async enrollStudents(@Param('id') id: string, @Body() dto: EnrollStudentsDto) {
    return this.classesService.enrollStudents(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Remove student from class' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classesService.removeStudent(id, studentId);
  }
}
