import { Global, Module } from '@nestjs/common';
import { AlmacenamientoService } from './almacenamiento.service';

@Global()
@Module({
  providers: [AlmacenamientoService],
  exports: [AlmacenamientoService],
})
export class AlmacenamientoModule {}
