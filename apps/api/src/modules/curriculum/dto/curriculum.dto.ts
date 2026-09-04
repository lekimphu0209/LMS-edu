import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

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
