import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelDto } from './create-hotel.dto';

// Uso exclusivo de superadmin (PATCH /hotels/:id) — permite tocar slug/activo/notasInternas.
export class UpdateHotelDto extends PartialType(CreateHotelDto) {}
