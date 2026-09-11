import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from '../classes/classes.service';
import { CreateClassDto, UpdateClassDto, EnrollStudentsDto } from '../classes/dto/class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/classes')
export class AdminClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List classes (admin)' })
  async findAll(
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.classesService.findAll(undefined, status, Number(page) || 1, Number(limit) || 50, search, subject);
  }

  @Post()
  @ApiOperation({ summary: 'Create class (admin)' })
  async create(@Body() dto: CreateClassDto, @CurrentUser('id') createdBy: string) {
    return this.classesService.create(dto, createdBy);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class detail (admin)' })
  async findById(@Param('id') id: string) {
    return this.classesService.findByIdWithStudents(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update class (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change class status (admin)' })
  async setStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'INACTIVE') {
    return this.classesService.setStatus(id, status);
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Enroll students (admin)' })
  async enrollStudents(@Param('id') id: string, @Body() dto: EnrollStudentsDto) {
    return this.classesService.enrollStudents(id, dto);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Remove student from class (admin)' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classesService.removeStudent(id, studentId);
  }
}
