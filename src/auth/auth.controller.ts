import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

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
}
