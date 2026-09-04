import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class StartSubmissionDto {
  @ApiProperty()
  @IsString()
  assignmentTargetId!: string;
}

export class SubmitSubmissionDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  answers!: SubmitAnswerDto[];
}

export class GradeAnswerDto {
  @ApiProperty()
  @IsString()
  answerId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  scoreEarned?: number;
}

export class GradeSubmissionDto {
  @ApiProperty({ type: [GradeAnswerDto] })
  @IsArray()
  answers!: GradeAnswerDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teacherNote?: string;
}
