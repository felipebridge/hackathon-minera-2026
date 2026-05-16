import { Test, TestingModule } from '@nestjs/testing';
import { SimulacionesService } from './simulaciones.service';
import { PrismaService } from '../comun/prisma/prisma.service';
import { InduccionService } from '../induccion/induccion.service';
import { NotFoundException } from '@nestjs/common';
import { EstadoInduccion, EtapaInduccion } from '@prisma/client';

const prismaMock = {
  simulacion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  induccionEmpleado: {
    findUnique: jest.fn(),
  },
};

const induccionServiceMock = {
  completarVR: jest.fn(),
};

describe('SimulacionesService — webhookCompletado', () => {
  let service: SimulacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulacionesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: InduccionService, useValue: induccionServiceMock },
      ],
    }).compile();

    service = module.get<SimulacionesService>(SimulacionesService);
    jest.clearAllMocks();
  });

  it('lanza NotFoundException si la inducción no existe', async () => {
    prismaMock.induccionEmpleado.findUnique.mockResolvedValue(null);

    await expect(
      service.procesarWebhookCompletado({ induccionId: 'no-existe', puntaje: 80, intentos: 1 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('llama a induccionService.completarVR con los parámetros correctos', async () => {
    prismaMock.induccionEmpleado.findUnique.mockResolvedValue({ id: 'ind-1' });
    induccionServiceMock.completarVR.mockResolvedValue({
      estado: EstadoInduccion.EN_CURSO,
      etapaActual: EtapaInduccion.EXAMEN_OBLIGATORIO,
    });

    const result = await service.procesarWebhookCompletado({
      induccionId: 'ind-1',
      puntaje: 82,
      intentos: 1,
    });

    expect(induccionServiceMock.completarVR).toHaveBeenCalledWith('ind-1', 82, 1);
    expect(result.aprobado).toBe(true);
    expect(result.estado).toBe(EstadoInduccion.EN_CURSO);
  });

  it('retorna aprobado=false cuando puntaje < 70', async () => {
    prismaMock.induccionEmpleado.findUnique.mockResolvedValue({ id: 'ind-1' });
    induccionServiceMock.completarVR.mockResolvedValue({
      estado: EstadoInduccion.REPROBADA,
      etapaActual: EtapaInduccion.SIMULACION_VR,
    });

    const result = await service.procesarWebhookCompletado({
      induccionId: 'ind-1',
      puntaje: 55,
      intentos: 1,
    });

    expect(result.aprobado).toBe(false);
    expect(result.estado).toBe(EstadoInduccion.REPROBADA);
  });
});
