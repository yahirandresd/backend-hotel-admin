import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { HotelService } from './hotel.service';
import { HotelController } from './hotel.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel]),
  ],
  controllers: [HotelController],
  providers: [HotelService],
  // TypeOrmModule se re-exporta para que otros módulos (ej. el provider del
  // TenantMiddleware en AppModule) puedan inyectar @InjectRepository(Hotel).
  exports: [HotelService, TypeOrmModule],
})
export class HotelModule {}
