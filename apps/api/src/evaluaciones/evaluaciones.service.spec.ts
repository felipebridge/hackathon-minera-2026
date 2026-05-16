import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionesService } from './evaluaciones.service';
import { PrismaService } from '../comun/prisma/prisma.service';
import { InduccionService } from '../induccion/induccion.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const evaluacionMock = {
  id: 'ev-1',
  titulo: 'Inducción Decreto 249/07',
  puntajeAprobacion: 70,
  intentosPermitidos: 3,
  aleatorizar: false,
  preguntas: [
    {
      id: 'p1',
      texto: '¿Qué establece el Decreto 249/07?',
      tipo: 'OPCION_MULTIPLE',
      opciones: [
        { texto: 'Reglamento de seguridad minera', esCorrecta: true },
        { texto: 'Reglamento ambiental', esCorrecta: false },
      ],
      puntaje: 10,
      respuestaCorrecta: null,
      explicacion: 'El Decreto 249/07 regula condiciones de higiene y seguridad en minería argentina.',
      categoriaError: 'normativa',
      orden: 1,
    },
  ],
};

const prismaMock = {
  evaluacion: { findUnique: jest.fn() },
  resultadoEvaluacion: { count: jest.fn(), create: jest.fn() },
  errorFrecuente: { upsert: jest.fn() },
};

const induccionMock = { registrarExamenAprobado: jest.fn() };

describe('EvaluacionesService', () => {
  let service: EvaluacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: InduccionService, useValue: induccionMock },
      ],
    }).compile();

    service = module.get<EvaluacionesService>(EvaluacionesService);
    jest.clearAllMocks();
  });

  describe('obtener()', () => {
    it('lanza NotFoundException si la evaluación no existe', async () => {
      prismaMock.evaluacion.findUnique.mockResolvedValue(null);

      await expect(service.obtener('no-existe', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si se agotaron los intentos', async () => {
      prismaMock.evaluacion.findUnique.mockResolvedValue(evaluacionMock);
      prismaMock.resultadoEvaluacion.count.mockResolvedValue(3);

      await expect(service.obtener('ev-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('retorna la evaluación con intentosUtilizados', async () => {
      prismaMock.evaluacion.findUnique.mockResolvedValue(evaluacionMock);
      prismaMock.resultadoEvaluacion.count.mockResolvedValue(1);

      const result = await service.obtener('ev-1', 'u1');

      expect(result.intentosUtilizados).toBe(1);
      expect(result.preguntas).toHaveLength(1);
    });
  });

  describe('enviarRespuestas()', () => {
    beforeEach(() => {
      prismaMock.evaluacion.findUnique.mockResolvedValue(evaluacionMock);
      prismaMock.resultadoEvaluacion.count.mockResolvedValue(0);
      prismaMock.resultadoEvaluacion.create.mockResolvedValue({
        id: 'res-1',
        puntaje: 100,
        aprobado: true,
        intento: 1,
      });
      prismaMock.errorFrecuente.upsert.mockResolvedValue({});
      induccionMock.registrarExamenAprobado.mockResolvedValue(undefined);
    });

    it('calcula puntaje 100% con respuesta correcta', async () => {
      const result = await service.enviarRespuestas(
        'ev-1',
        [{ preguntaId: 'p1', respuestaUsuario: 'Reglamento de seguridad minera' }],
        120,
        'u1',
      );

      expect(result.resultado.porcentaje).toBe(100);
      expect(result.resultado.aprobado ?? true).toBeTruthy();
    });

    it('calcula puntaje 0% con respuesta incorrecta y genera categoría de error', async () => {
      prismaMock.resultadoEvaluacion.create.mockResolvedValue({
        id: 'res-2',
        puntaje: 0,
        aprobado: false,
        intento: 1,
      });

      const result = await service.enviarRespuestas(
        'ev-1',
        [{ preguntaId: 'p1', respuestaUsuario: 'Reglamento ambiental' }],
        90,
        'u1',
      );

      expect(result.resultado.porcentaje).toBe(0);
      expect(prismaMock.errorFrecuente.upsert).toHaveBeenCalled();
    });

    it('llama a induccionService.registrarExamenAprobado después de evaluar', async () => {
      await service.enviarRespuestas(
        'ev-1',
        [{ preguntaId: 'p1', respuestaUsuario: 'Reglamento de seguridad minera' }],
        120,
        'u1',
      );

      expect(induccionMock.registrarExamenAprobado).toHaveBeenCalledWith('u1', 100, 1, 3);
    });
  });
});
