import { Test, TestingModule } from '@nestjs/testing';
import { AutenticacionService } from './autenticacion.service';
import { PrismaService } from '../comun/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../comun/redis/redis.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const prismaMock = {
  usuario: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  tokenRefresh: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const jwtMock = { sign: jest.fn().mockReturnValue('mock-token') };
const configMock = { get: jest.fn().mockReturnValue('7d'), getOrThrow: jest.fn().mockReturnValue('secreto') };
const redisMock = { eliminar: jest.fn() };

describe('AutenticacionService', () => {
  let service: AutenticacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<AutenticacionService>(AutenticacionService);
    jest.clearAllMocks();
    jwtMock.sign.mockReturnValue('mock-token');
    configMock.get.mockReturnValue('7d');
    configMock.getOrThrow.mockReturnValue('secreto');
  });

  describe('validarUsuario()', () => {
    it('retorna null si el usuario no existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validarUsuario('no@existe.com', 'pass');
      expect(result).toBeNull();
    });

    it('retorna null si la contraseña es incorrecta', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        contrasenaHash: 'hash',
        intentosFallidos: 0,
        bloqueadoHasta: null,
        estado: 'ACTIVO',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      prismaMock.usuario.update.mockResolvedValue({});

      const result = await service.validarUsuario('x@x.com', 'wrong');
      expect(result).toBeNull();
    });

    it('lanza UnauthorizedException si la cuenta está bloqueada', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@x.com',
        contrasenaHash: 'hash',
        intentosFallidos: 5,
        bloqueadoHasta: new Date(Date.now() + 3600000),
      });

      await expect(service.validarUsuario('x@x.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registro()', () => {
    it('lanza ConflictException si el email ya existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.registro({ nombre: 'A', apellido: 'B', email: 'a@b.com', contrasena: '123' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('crea el usuario con rol EMPLEADO y devuelve tokens', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash' as never);
      prismaMock.usuario.create.mockResolvedValue({
        id: 'u-new',
        nombre: 'Juan',
        apellido: 'Díaz',
        email: 'juan@test.com',
        rol: 'EMPLEADO',
        estado: 'ACTIVO',
        avatarUrl: null,
        cargo: null,
        area: null,
      });
      prismaMock.tokenRefresh.create.mockResolvedValue({});

      const result = await service.registro({
        nombre: 'Juan',
        apellido: 'Díaz',
        email: 'juan@test.com',
        contrasena: 'Password1!',
      } as any);

      expect(prismaMock.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rol: 'EMPLEADO' }) }),
      );
      expect(result.accessToken).toBe('mock-token');
    });
  });
});
