import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadEventoDto } from './create-actividad-evento.dto';

export class UpdateActividadEventoDto extends PartialType(CreateActividadEventoDto) {}