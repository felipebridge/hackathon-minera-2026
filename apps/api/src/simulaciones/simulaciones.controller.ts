import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { SimulacionesService } from './simulaciones.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { RutaPublica } from '../autenticacion/decoradores/ruta-publica.decorador';

class WebhookVRDto {
  @ApiProperty({ description: 'ID de la inducción asociada' })
  @IsString()
  induccionId: string;

  @ApiProperty({ description: 'Puntaje obtenido (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  puntaje: number;

  @ApiProperty({ description: 'Número de intento', minimum: 1 })
  @IsNumber()
  @Min(1)
  intentos: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sesionVR?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duracionSegundos?: number;
}

@ApiTags('simulaciones')
@Controller({ path: 'simulaciones', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class SimulacionesController {
  constructor(private readonly simulacionesService: SimulacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar simulaciones VR disponibles' })
  async listar() {
    const datos = await this.simulacionesService.listar();
    return { exito: true, datos };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de simulación' })
  async obtener(@Param('id') id: string) {
    const datos = await this.simulacionesService.obtenerPorId(id);
    return { exito: true, datos };
  }

  @Get(':id/manifesto-vr')
  @ApiOperation({ summary: 'Obtener configuración JSON para SDK Meta Quest' })
  async manifestoVR(@Param('id') id: string) {
    const datos = await this.simulacionesService.generarManifestoVR(id);
    return { exito: true, datos };
  }

  @Post('webhook/completado')
  @RutaPublica()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback desde Meta Quest al finalizar simulación VR',
    description: 'Recibe el resultado de la simulación, actualiza progreso y dispara transición de etapa.',
  })
  async webhookCompletado(@Body() dto: WebhookVRDto) {
    const datos = await this.simulacionesService.procesarWebhookCompletado(dto);
    return { exito: true, datos };
  }
}
