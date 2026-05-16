import { Module } from '@nestjs/common';
import { InduccionController } from './induccion.controller';
import { InduccionService } from './induccion.service';
import { PrismaModule } from '../comun/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InduccionController],
  providers: [InduccionService],
  exports: [InduccionService],
})
export class InduccionModule {}
