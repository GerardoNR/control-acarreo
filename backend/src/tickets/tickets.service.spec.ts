import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { TicketsService } from './tickets.service';

class TicketsServiceDeterminista extends TicketsService {
  private indice = 0;

  constructor(
    repository: Repository<Ticket>,
    private readonly sufijos: string[],
  ) {
    super(repository);
  }

  protected generarSufijo(): string {
    const sufijo = this.sufijos[this.indice] ?? this.sufijos.at(-1);
    this.indice += 1;
    if (!sufijo) throw new Error('No hay sufijo configurado');
    return sufijo;
  }
}

describe('TicketsService', () => {
  const repository = {} as Repository<Ticket>;
  const fecha = new Date('2026-08-28T15:15:42.000Z');

  it('reintenta una colisión del código y conserva la relación 1:1', async () => {
    const ticket = { id: 'ticket-2', codigo_ticket: 'codigo-2' } as Ticket;
    const codigosInsertados: string[] = [];
    const sentenciasEjecutadas: string[] = [];
    const query = jest.fn((sql: string, parametros: unknown[]) => {
      sentenciasEjecutadas.push(sql);
      codigosInsertados.push(String(parametros[2]));
      return Promise.resolve(
        codigosInsertados.length === 1 ? [] : [{ id: 'ticket-2' }],
      );
    });
    const findOneOrFail = jest.fn().mockResolvedValue(ticket);
    const manager = { query, findOneOrFail } as unknown as EntityManager;
    const service = new TicketsServiceDeterminista(repository, [
      '0001',
      '0002',
    ]);

    await expect(
      service.crearParaViaje(manager, 'viaje-1', '23714', fecha),
    ).resolves.toBe(ticket);
    expect(query).toHaveBeenCalledTimes(2);
    expect(codigosInsertados).toEqual([
      '260828237140915420001',
      '260828237140915420002',
    ]);
    expect(sentenciasEjecutadas[0]).toContain(
      'ON CONFLICT ON CONSTRAINT "UQ_tickets_codigo_ticket"',
    );
  });

  it('falla de forma controlada después de diez colisiones', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const manager = { query } as unknown as EntityManager;
    const service = new TicketsServiceDeterminista(repository, ['0001']);

    await expect(
      service.crearParaViaje(manager, 'viaje-1', '23714', fecha),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(query).toHaveBeenCalledTimes(10);
  });

  it('busca el ticket por su código textual', async () => {
    const ticket = { codigo_ticket: '260828237140915421537' } as Ticket;
    const findOne = jest.fn().mockResolvedValue(ticket);
    const service = new TicketsService({
      findOne,
    } as unknown as Repository<Ticket>);

    await expect(
      service.buscarPorCodigo('260828237140915421537'),
    ).resolves.toBe(ticket);
    expect(findOne).toHaveBeenCalledWith({
      where: { codigo_ticket: '260828237140915421537' },
      relations: { viaje: true },
    });
  });

  it('responde 404 si el código no existe', async () => {
    const service = new TicketsService({
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Ticket>);

    await expect(
      service.buscarPorCodigo('260828237140915421537'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('expone únicamente los datos operativos del ticket y viaje', () => {
    const service = new TicketsService(repository);
    const respuesta = service.aRespuestaConsulta({
      id: 'ticket-id',
      codigo_ticket: '260828237140915421537',
      fecha_generacion: fecha,
      viaje: {
        id: 'viaje-id',
        folio: 'VIA-20260828-000125',
        estado: 'en_transito',
        nota: 'no debe exponerse',
      },
    } as Ticket);

    expect(respuesta).toEqual({
      id: 'ticket-id',
      codigo_ticket: '260828237140915421537',
      fecha_generacion: fecha,
      viaje: {
        id: 'viaje-id',
        folio: 'VIA-20260828-000125',
        estado: 'en_transito',
      },
    });
  });
});
