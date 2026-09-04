import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'user@educonnect.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'TEACHER', 'STUDENT'], default: 'STUDENT' })
  @IsEnum(['ADMIN', 'TEACHER', 'STUDENT'])
  @IsOptional()
  role?: string;
}
