import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'TEACHER', 'STUDENT'] })
  @IsEnum(['ADMIN', 'TEACHER', 'STUDENT'])
  role!: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  newPassword!: string;
}
