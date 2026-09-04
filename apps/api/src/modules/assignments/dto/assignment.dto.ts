import { IsString, IsOptional, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class AssignmentQuestionInputDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  orderIndex?: number;
}

export class CreateAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ type: [AssignmentQuestionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentQuestionInputDto)
  questions!: AssignmentQuestionInputDto[];
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class CreateAssignmentTargetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  unlockDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
