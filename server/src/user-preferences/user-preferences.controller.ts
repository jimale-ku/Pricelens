import { Controller, Get, Patch, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('User Preferences')
@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  get(@Request() req) {
    return this.userPreferencesService.getOrCreate(req.user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences' })
  update(@Request() req, @Body() updateDto: UpdateUserPreferencesDto) {
    return this.userPreferencesService.update(req.user.userId, updateDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Reset user preferences to defaults' })
  delete(@Request() req) {
    return this.userPreferencesService.delete(req.user.userId);
  }
}
