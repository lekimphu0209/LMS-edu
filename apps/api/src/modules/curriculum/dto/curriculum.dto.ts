import { IsString, IsOptional, IsInt, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCurriculumDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  subject!: string;
}

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {
  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED'], required: false })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: string;
}

export class CreateChapterDto {
  @ApiProperty()
  @IsString()
  curriculumId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  chapterId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentNote?: string;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}

// ── Whole-tree save ──

export class LessonInputDto {
  @ApiPropertyOptional({ description: 'Existing lesson id; omit for new' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentNote?: string;

  @ApiPropertyOptional({ type: [String], description: 'Question ids from the question bank, in order' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionIds?: string[];
}

export class ChapterInputDto {
  @ApiPropertyOptional({ description: 'Existing chapter id; omit for new' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ type: [LessonInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonInputDto)
  lessons?: LessonInputDto[];
}

export class SetCurriculumStructureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [ChapterInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterInputDto)
  chapters!: ChapterInputDto[];
}
