import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../comun/prisma/prisma.service';

interface PayloadJwt {
  sub: string;
  email: string;
  rol: string;
  iat: number;
  exp: number;
}

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_SECRETO'),
      issuer: 'mineria-capacitacion',
    });
  }

  async validate(payload: PayloadJwt) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        estado: true,
        avatarUrl: true,
        cargo: true,
        area: true,
        telefono: true,
      },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Sesión inválida o usuario inactivo');
    }

    return usuario;
  }
}
