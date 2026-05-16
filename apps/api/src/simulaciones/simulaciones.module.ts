import { Module } from '@nestjs/common';
import { SimulacionesController } from './simulaciones.controller';
import { SimulacionesService } from './simulaciones.service';
import { PrismaModule } from '../comun/prisma/prisma.module';
import { InduccionModule } from '../induccion/induccion.module';

@Module({
  imports: [PrismaModule, InduccionModule],
  controllers: [SimulacionesController],
  providers: [SimulacionesService],
})
export class SimulacionesModule {}
