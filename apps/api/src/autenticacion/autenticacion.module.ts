import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { EstrategiaJwt } from './estrategias/jwt.estrategia';
import { EstrategiaLocal } from './estrategias/local.estrategia';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    UsuariosModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRETO'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRACION', '7d'),
          issuer: 'mineria-capacitacion',
        },
      }),
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, EstrategiaJwt, EstrategiaLocal],
  exports: [JwtModule, AutenticacionService],
})
export class AutenticacionModule {}
