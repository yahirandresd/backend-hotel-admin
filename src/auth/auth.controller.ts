import { Body, Controller, Post, Patch, Param } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

class UpdateMetadataDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
}

@Roles('admin')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('staff')
  createStaff(@Body() body: CreateUserDto) {
    return this.authService.createStaff(body.email, body.password, body.nombre, body.apellido);
  }

  @Post('admin')
  createAdmin(@Body() body: CreateUserDto) {
    return this.authService.createAdmin(body.email, body.password, body.nombre, body.apellido);
  }

  @Patch('users/:id/metadata')
  updateMetadata(@Param('id') id: string, @Body() body: UpdateMetadataDto) {
    return this.authService.updateMetadata(id, body);
  }
}
