import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
