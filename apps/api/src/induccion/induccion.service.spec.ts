import { Test, TestingModule } from '@nestjs/testing';
import { InduccionService } from './induccion.service';
import { PrismaService } from '../comun/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EstadoInduccion, EtapaInduccion } from '@prisma/client';

const prismaMock = {
  induccionEmpleado: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  usuario: {
    findUnique: jest.fn(),
  },
};

describe('InduccionService', () => {
  let service: InduccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InduccionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InduccionService>(InduccionService);
    jest.clearAllMocks();
  });

  describe('iniciar()', () => {
    it('lanza ConflictException si el usuario ya tiene inducción', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue({ id: 'ind-1' });

      await expect(service.iniciar('usuario-1')).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(null);
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      await expect(service.iniciar('usuario-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('crea inducción en estado EN_CURSO etapa CHARLA_INTRODUCTORIA', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(null);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 'u1', nombre: 'Juan', apellido: 'Díaz' });
      prismaMock.induccionEmpleado.create.mockResolvedValue({
        id: 'ind-1',
        estado: EstadoInduccion.EN_CURSO,
        etapaActual: EtapaInduccion.CHARLA_INTRODUCTORIA,
      });

      const result = await service.iniciar('u1', 'instructor-1');

      expect(prismaMock.induccionEmpleado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoInduccion.EN_CURSO,
            etapaActual: EtapaInduccion.CHARLA_INTRODUCTORIA,
          }),
        }),
      );
      expect(result.estado).toBe(EstadoInduccion.EN_CURSO);
    });
  });

  describe('completarVR()', () => {
    const induccionBase = {
      id: 'ind-1',
      estado: EstadoInduccion.EN_CURSO,
      etapaActual: EtapaInduccion.SIMULACION_VR,
      iniciadaEn: new Date(Date.now() - 3600000),
    };

    it('avanza a EXAMEN_OBLIGATORIO cuando puntaje >= 70', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(induccionBase);
      prismaMock.induccionEmpleado.update.mockResolvedValue({
        ...induccionBase,
        vrCompletado: true,
        vrPuntaje: 85,
        estado: EstadoInduccion.EN_CURSO,
        etapaActual: EtapaInduccion.EXAMEN_OBLIGATORIO,
      });

      const result = await service.completarVR('ind-1', 85, 1);

      expect(prismaMock.induccionEmpleado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoInduccion.EN_CURSO,
            etapaActual: EtapaInduccion.EXAMEN_OBLIGATORIO,
          }),
        }),
      );
      expect(result.etapaActual).toBe(EtapaInduccion.EXAMEN_OBLIGATORIO);
    });

    it('pasa a REPROBADA cuando puntaje < 70', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(induccionBase);
      prismaMock.induccionEmpleado.update.mockResolvedValue({
        ...induccionBase,
        vrPuntaje: 50,
        estado: EstadoInduccion.REPROBADA,
      });

      const result = await service.completarVR('ind-1', 50, 1);

      expect(prismaMock.induccionEmpleado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoInduccion.REPROBADA,
          }),
        }),
      );
      expect(result.estado).toBe(EstadoInduccion.REPROBADA);
    });

    it('lanza NotFoundException si la inducción no existe', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(null);

      await expect(service.completarVR('no-existe', 90, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarExamenAprobado()', () => {
    const induccionBase = {
      id: 'ind-1',
      usuarioId: 'u1',
      iniciadaEn: new Date(Date.now() - 7200000),
    };

    it('pasa a COMPLETADA cuando aprobado y calcula tiempoTotalHoras', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(induccionBase);
      prismaMock.induccionEmpleado.update.mockResolvedValue({});

      await service.registrarExamenAprobado('u1', 80, 1, 3);

      expect(prismaMock.induccionEmpleado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoInduccion.COMPLETADA,
            tiempoTotalHoras: expect.any(Number),
          }),
        }),
      );
    });

    it('pasa a REPROBADA al agotar los intentos sin aprobar', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(induccionBase);
      prismaMock.induccionEmpleado.update.mockResolvedValue({});

      await service.registrarExamenAprobado('u1', 45, 3, 3);

      expect(prismaMock.induccionEmpleado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoInduccion.REPROBADA,
          }),
        }),
      );
    });

    it('no cambia estado si reprueba pero aún tiene intentos', async () => {
      prismaMock.induccionEmpleado.findUnique.mockResolvedValue(induccionBase);
      prismaMock.induccionEmpleado.update.mockResolvedValue({});

      await service.registrarExamenAprobado('u1', 45, 1, 3);

      const llamada = prismaMock.induccionEmpleado.update.mock.calls[0][0];
      expect(llamada.data.estado).toBeUndefined();
    });
  });
});
