import { Body, Controller, Post, Patch, Param, Req, BadRequestException } from '@nestjs/common';
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

  // Solo superadmin y admin pueden crear staff — para admin, el hotel es
  // siempre el suyo propio (body.hotelId se ignora salvo que sea superadmin).
  @Roles('superadmin', 'admin')
  @Post('staff')
  createStaff(@Body() body: CreateUserDto, @Req() req: Request) {
    const caller  = (req as any).user;
    const hotelId = caller.role === 'superadmin' ? body.hotelId : caller.hotelId;

    if (!hotelId) {
      throw new BadRequestException('hotelId es requerido');
    }

    return this.authService.createStaff(body.email, body.password, body.nombre, body.apellido, hotelId);
  }

  // Solo superadmin puede crear admins — siempre debe indicar para qué hotel.
  @Roles('superadmin')
  @Post('admin')
  createAdmin(@Body() body: CreateUserDto) {
    if (!body.hotelId) {
      throw new BadRequestException('hotelId es requerido para crear un admin');
    }

    return this.authService.createAdmin(body.email, body.password, body.nombre, body.apellido, body.hotelId);
  }

  // superadmin y admin pueden editar metadata de usuarios de su propio hotel
  // (superadmin, de cualquiera)
  @Roles('superadmin', 'admin')
  @Patch('users/:id/metadata')
  updateMetadata(@Param('id') id: string, @Body() body: UpdateMetadataDto, @Req() req: Request) {
    const caller = (req as any).user;
    return this.authService.updateMetadata(id, body, { role: caller.role, hotelId: caller.hotelId });
  }

  // Cualquier rol puede editar su propio nombre/apellido
  @Roles('superadmin', 'admin', 'staff')
  @Patch('me/metadata')
  updateMyMetadata(@Req() req: Request, @Body() body: UpdateMetadataDto) {
    const caller = (req as any).user;
    return this.authService.updateMetadata(caller.id, body, { role: caller.role, hotelId: caller.hotelId });
  }
}
