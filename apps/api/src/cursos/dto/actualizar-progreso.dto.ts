import { IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarProgresoDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;

  @ApiProperty()
  @IsBoolean()
  completado: boolean;

  @ApiPropertyOptional({ description: 'Segundos adicionales dedicados en esta sesión' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tiempoAdicionalSegundos?: number;
}
