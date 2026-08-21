import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateHotelDto } from './create-hotel.dto';

// Uso de admin de hotel (PATCH /hotels/me) — sin slug, activo ni notasInternas,
// esos campos son propiedad exclusiva de la plataforma (superadmin).
export class UpdateHotelMeDto extends PartialType(
  PickType(CreateHotelDto, [
    'nombre', 'nombreLegal', 'nit', 'email', 'telefono', 'direccion',
    'ciudad', 'pais', 'timezone', 'moneda', 'logoUrl',
    'checkInHora', 'checkOutHora', 'politicaCancelacion',
  ] as const),
) {}
