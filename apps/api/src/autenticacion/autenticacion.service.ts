import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../comun/prisma/prisma.service';
import { RedisService } from '../comun/redis/redis.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import type { Usuario } from '@prisma/client';

const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 30;
const RONDAS_BCRYPT = 12;

@Injectable()
export class AutenticacionService {
  private readonly logger = new Logger(AutenticacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async validarUsuario(email: string, contrasena: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      await bcrypt.compare(contrasena, '$2b$12$placeholder_hash_para_timing_attack');
      return null;
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intente nuevamente en ${minutosRestantes} minuto(s).`,
      );
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasenaHash);

    if (!coincide) {
      await this.registrarIntentoFallido(usuario);
      return null;
    }

    if (usuario.intentosFallidos > 0) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });

    return usuario;
  }

  private async registrarIntentoFallido(usuario: Usuario): Promise<void> {
    const nuevoConteo = usuario.intentosFallidos + 1;
    const datos: Partial<Pick<Usuario, 'intentosFallidos' | 'bloqueadoHasta'>> = {
      intentosFallidos: nuevoConteo,
    };

    if (nuevoConteo >= MAX_INTENTOS_FALLIDOS) {
      datos.bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000);
      this.logger.warn(`Cuenta bloqueada por exceso de intentos: ${usuario.email}`);
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: datos,
    });
  }

  async iniciarSesion(dto: IniciarSesionDto) {
    const usuario = await this.validarUsuario(dto.email, dto.contrasena);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('La cuenta está inactiva. Contacte al administrador.');
    }

    return this.generarTokenes(usuario);
  }

  async registro(dto: RegistroDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const hash = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        contrasenaHash: hash,
        telefono: dto.telefono,
        cargo: dto.cargo,
        area: dto.area,
        rol: 'EMPLEADO',
      },
    });

    this.logger.log(`Nuevo usuario registrado: ${usuario.email}`);

    return this.generarTokenes(usuario);
  }

  async renovarToken(refreshToken: string) {
    const tokenGuardado = await this.prisma.tokenRefresh.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenGuardado || tokenGuardado.revocado || tokenGuardado.expiraEn < new Date()) {
      throw new UnauthorizedException('Token de renovación inválido o expirado');
    }

    await this.prisma.tokenRefresh.update({
      where: { id: tokenGuardado.id },
      data: { revocado: true },
    });

    return this.generarTokenes(tokenGuardado.usuario);
  }

  async cerrarSesion(usuarioId: string, refreshToken: string): Promise<void> {
    await this.prisma.tokenRefresh.updateMany({
      where: { usuarioId, token: refreshToken },
      data: { revocado: true },
    });

    await this.redis.eliminar(`sesion:${usuarioId}`);
  }

  private async generarTokenes(usuario: Usuario) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRACION', '7d'),
    });

    const refreshTokenExpiracion = new Date();
    refreshTokenExpiracion.setDate(refreshTokenExpiracion.getDate() + 30);

    const refreshTokenString = this.jwt.sign(
      { sub: usuario.id, tipo: 'refresh' },
      {
        secret: this.config.getOrThrow('JWT_SECRETO'),
        expiresIn: this.config.get('JWT_EXPIRACION_REFRESH', '30d'),
      },
    );

    await this.prisma.tokenRefresh.create({
      data: {
        token: refreshTokenString,
        usuarioId: usuario.id,
        expiraEn: refreshTokenExpiracion,
      },
    });

    return {
      exito: true,
      accessToken,
      refreshToken: refreshTokenString,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        avatarUrl: usuario.avatarUrl,
        cargo: usuario.cargo,
        area: usuario.area,
      },
    };
  }
}
