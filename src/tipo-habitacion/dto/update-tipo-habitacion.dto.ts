import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoHabitacionDto } from './create-tipo-habitacion.dto';

export class UpdateTipoHabitacionDto extends PartialType(CreateTipoHabitacionDto) {}