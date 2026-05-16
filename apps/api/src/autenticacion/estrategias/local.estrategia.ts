import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AutenticacionService } from '../autenticacion.service';

@Injectable()
export class EstrategiaLocal extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly autenticacionService: AutenticacionService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, contrasena: string) {
    const usuario = await this.autenticacionService.validarUsuario(email, contrasena);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return usuario;
  }
}
