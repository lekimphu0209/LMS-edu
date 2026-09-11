import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from '../users/dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  async findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(role, status, search, Number(page) || 1, Number(limit) || 50);
  }

  @Post()
  @ApiOperation({ summary: 'Create user (admin)' })
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') createdBy: string) {
    return this.usersService.create(dto, createdBy);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user detail with classes (admin)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findByIdWithClasses(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate/deactivate user (admin)' })
  async setStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'INACTIVE') {
    return this.usersService.setStatus(id, status);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password (admin)' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser('id') resetBy: string,
  ) {
    return this.usersService.resetPassword(id, dto, resetBy);
  }

  @Get(':id/reset-logs')
  @ApiOperation({ summary: 'Password reset logs (admin)' })
  async getResetLogs(@Param('id') id: string) {
    return this.usersService.getPasswordResetLogs(id);
  }
}
