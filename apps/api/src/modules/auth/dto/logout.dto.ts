/** DTO đăng xuất — chỉ cần refresh token để thu hồi. */
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
