import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  teacherId!: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}

export class EnrollStudentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  studentIds!: string[];
}
