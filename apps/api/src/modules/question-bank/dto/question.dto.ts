import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType as SwaggerPartialType } from '@nestjs/swagger';

export class QuestionOptionDto {
  @ApiProperty()
  @IsString()
  optionText!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  optionImageUrl?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty({ enum: ['SINGLE', 'MULTI', 'FILL_BLANK'] })
  @IsEnum(['SINGLE', 'MULTI', 'FILL_BLANK'])
  type!: string;

  @ApiProperty()
  @IsString()
  questionText!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  questionImageUrl?: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: string;

  @ApiProperty({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultScore?: number;

  @ApiProperty({ type: [QuestionOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

export class UpdateQuestionDto extends SwaggerPartialType(CreateQuestionDto) {}
