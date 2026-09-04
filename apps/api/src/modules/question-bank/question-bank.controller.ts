import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Question Bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('question-bank')
export class QuestionBankController {
  constructor(private questionBankService: QuestionBankService) {}

  @Get()
  @ApiOperation({ summary: 'List questions' })
  async findAll(
    @Query('teacherId') teacherId?: string,
    @Query('subject') subject?: string,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionBankService.findAll(teacherId, subject, type, difficulty, q, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID with options' })
  async findById(@Param('id') id: string) {
    return this.questionBankService.findById(id);
  }

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create question with options' })
  async create(@Body() dto: CreateQuestionDto, @CurrentUser('id') teacherId: string) {
    return this.questionBankService.create(dto, teacherId);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Update question' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionBankService.update(id, dto);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Delete question' })
  async delete(@Param('id') id: string) {
    return this.questionBankService.delete(id);
  }
}
