import { Body, Controller, Post, Patch, Param, Req } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

class UpdateMetadataDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Solo superadmin y admin pueden crear staff
  @Roles('superadmin', 'admin')
  @Post('staff')
  createStaff(@Body() body: CreateUserDto) {
    return this.authService.createStaff(body.email, body.password, body.nombre, body.apellido);
  }

  // Solo superadmin puede crear admins
  @Roles('superadmin')
  @Post('admin')
  createAdmin(@Body() body: CreateUserDto) {
    return this.authService.createAdmin(body.email, body.password, body.nombre, body.apellido);
  }

  // superadmin y admin pueden editar metadata de cualquier usuario
  @Roles('superadmin', 'admin')
  @Patch('users/:id/metadata')
  updateMetadata(@Param('id') id: string, @Body() body: UpdateMetadataDto) {
    return this.authService.updateMetadata(id, body);
  }

  // Cualquier rol puede editar su propio nombre/apellido
  @Roles('superadmin', 'admin', 'staff')
  @Patch('me/metadata')
  updateMyMetadata(@Req() req: Request, @Body() body: UpdateMetadataDto) {
    const userId = (req as any).user.id;
    return this.authService.updateMetadata(userId, body);
  }
}
