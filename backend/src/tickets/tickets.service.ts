import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { EntityManager, Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import {
  construirCodigoTicket,
  generarSufijoTicket,
  MAXIMO_REINTENTOS_CODIGO_TICKET,
} from './ticket-code';

interface TicketInsertado {
  id: string;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async buscarPorCodigo(codigoTicket: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { codigo_ticket: codigoTicket },
      relations: { viaje: true },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
    return ticket;
  }

  aRespuestaConsulta(ticket: Ticket) {
    return {
      id: ticket.id,
      codigo_ticket: ticket.codigo_ticket,
      fecha_generacion: ticket.fecha_generacion,
      viaje: {
        id: ticket.viaje.id,
        folio: ticket.viaje.folio,
        estado: ticket.viaje.estado,
      },
    };
  }

  crearParaViaje(
    manager: EntityManager,
    viajeId: string,
    codigoUnidad: string,
    fechaGeneracion = new Date(),
    dispositivoEmisorId: string | null = null,
  ): Promise<Ticket> {
    return this.intentarCrear(
      manager,
      viajeId,
      codigoUnidad,
      fechaGeneracion,
      dispositivoEmisorId,
    );
  }

  protected generarSufijo(): string {
    return generarSufijoTicket();
  }

  private async intentarCrear(
    manager: EntityManager,
    viajeId: string,
    codigoUnidad: string,
    fechaGeneracion: Date,
    dispositivoEmisorId: string | null,
  ): Promise<Ticket> {
    for (
      let intento = 1;
      intento <= MAXIMO_REINTENTOS_CODIGO_TICKET;
      intento += 1
    ) {
      const codigoTicket = construirCodigoTicket(
        fechaGeneracion,
        codigoUnidad,
        this.generarSufijo(),
      );
      const id = randomUUID();
      const insertados = await manager.query<TicketInsertado[]>(
        `INSERT INTO "tickets" (
          "id", "viaje_id", "codigo_ticket", "fecha_generacion",
          "fecha_primera_impresion", "fecha_ultima_impresion",
          "cantidad_reimpresiones", "dispositivo_emisor_id",
          "creado_en", "actualizado_en"
        ) VALUES ($1, $2, $3, $4, NULL, NULL, 0, $5, NOW(), NOW())
        ON CONFLICT ON CONSTRAINT "UQ_tickets_codigo_ticket" DO NOTHING
        RETURNING "id"`,
        [id, viajeId, codigoTicket, fechaGeneracion, dispositivoEmisorId],
      );
      if (insertados.length > 0) {
        return manager.findOneOrFail(Ticket, {
          where: { id },
          relations: { viaje: true },
        });
      }
    }

    throw new ServiceUnavailableException({
      code: 'TICKET_CODE_GENERATION_EXHAUSTED',
      message: 'No fue posible generar un código de ticket único',
    });
  }
}
