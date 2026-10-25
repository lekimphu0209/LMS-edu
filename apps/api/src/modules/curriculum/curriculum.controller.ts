import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import {
  CreateCurriculumDto,
  UpdateCurriculumDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  SetCurriculumStructureDto,
} from './dto/curriculum.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  // ── Curriculum ──

  @Get()
  @ApiOperation({ summary: 'List curriculums (teachers see their own by default)' })
  async findAll(
    @Query('teacherId') teacherId: string | undefined,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const effectiveTeacherId = role === 'TEACHER' && !teacherId ? userId : teacherId;
    return this.curriculumService.findAll(effectiveTeacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get curriculum with chapters and lessons' })
  async findById(@Param('id') id: string) {
    return this.curriculumService.findById(id);
  }

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create curriculum' })
  async create(@Body() dto: CreateCurriculumDto, @CurrentUser('id') teacherId: string) {
    return this.curriculumService.create(dto, teacherId);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Update curriculum' })
  async update(@Param('id') id: string, @Body() dto: UpdateCurriculumDto) {
    return this.curriculumService.update(id, dto);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete curriculum' })
  async delete(@Param('id') id: string) {
    return this.curriculumService.delete(id);
  }

  @Put(':id/structure')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Replace whole curriculum tree (chapters → lessons → questions) in one transaction' })
  async setStructure(@Param('id') id: string, @Body() dto: SetCurriculumStructureDto) {
    return this.curriculumService.setStructure(id, dto);
  }

  // ── Chapter ──

  @Post('chapters')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create chapter' })
  async createChapter(@Body() dto: CreateChapterDto) {
    return this.curriculumService.createChapter(dto);
  }

  @Patch('chapters/:id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Update chapter' })
  async updateChapter(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.curriculumService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete chapter' })
  async deleteChapter(@Param('id') id: string) {
    return this.curriculumService.deleteChapter(id);
  }

  // ── Lesson ──

  @Post('lessons')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create lesson' })
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.curriculumService.createLesson(dto);
  }

  @Patch('lessons/:id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Update lesson' })
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.curriculumService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete lesson' })
  async deleteLesson(@Param('id') id: string) {
    return this.curriculumService.deleteLesson(id);
  }
}
