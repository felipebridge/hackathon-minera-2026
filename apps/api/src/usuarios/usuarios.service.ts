import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { RolUsuario, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(pagina = 1, limite = 20, busqueda?: string) {
    const saltar = (pagina - 1) * limite;
    const where = busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' as const } },
            { apellido: { contains: busqueda, mode: 'insensitive' as const } },
            { email: { contains: busqueda, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, usuarios] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip: saltar,
        take: limite,
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          estado: true,
          cargo: true,
          area: true,
          ultimoAcceso: true,
          creadoEn: true,
          _count: { select: { cursosAsignados: true, certificaciones: true } },
        },
      }),
    ]);

    return { usuarios, total, pagina, paginas: Math.ceil(total / limite) };
  }

  async obtenerPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        estado: true,
        cargo: true,
        area: true,
        telefono: true,
        avatarUrl: true,
        ultimoAcceso: true,
        creadoEn: true,
        cursosAsignados: {
          include: { curso: { select: { titulo: true, estado: true } } },
        },
        certificaciones: {
          include: { curso: { select: { titulo: true } } },
        },
      },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async obtenerPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async actualizarRol(id: string, rol: RolUsuario) {
    await this.verificarExistencia(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: { id: true, email: true, rol: true },
    });
  }

  async actualizarEstado(id: string, estado: EstadoUsuario) {
    await this.verificarExistencia(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { estado, ...(estado === 'ACTIVO' && { intentosFallidos: 0, bloqueadoHasta: null }) },
      select: { id: true, email: true, estado: true },
    });
  }

  async asignarCurso(usuarioId: string, cursoId: string) {
    const existe = await this.prisma.cursoAsignado.findUnique({
      where: { usuarioId_cursoId: { usuarioId, cursoId } },
    });

    if (existe) throw new ConflictException('El curso ya está asignado a este usuario');

    return this.prisma.cursoAsignado.create({
      data: { usuarioId, cursoId },
    });
  }

  private async verificarExistencia(id: string): Promise<void> {
    const existe = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Usuario no encontrado');
  }
}
