import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Res,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import type { Response, Request } from 'express';

@ApiTags('whatsapp')
@Controller({ path: 'whatsapp', version: '1' })
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('webhook')
  @ApiOperation({ summary: 'Verificación de webhook por Meta' })
  verificarWebhook(
    @Query('hub.mode') modo: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') desafio: string,
    @Res() res: Response,
  ) {
    try {
      const respuesta = this.whatsappService.verificarWebhook(modo, token, desafio);
      res.status(200).send(respuesta);
    } catch {
      res.status(403).send('Acceso denegado');
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibir mensajes y eventos de WhatsApp' })
  async recibirWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') firma: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const bodyRaw = req.rawBody?.toString() ?? JSON.stringify(payload);

    if (firma && !this.whatsappService.verificarFirma(bodyRaw, firma)) {
      this.logger.warn('Firma de webhook inválida');
      return { estado: 'ok' }; 

    this.whatsappService.procesarWebhook(payload).catch((err) => {
      this.logger.error(`Error procesando webhook: ${err.message}`);
    });

    return { estado: 'ok' };
  }
}
