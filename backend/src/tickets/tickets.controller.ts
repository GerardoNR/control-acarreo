import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsultarTicketDto } from './dto/consultar-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR, Role.CHECADOR)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('codigo/:codigo')
  async buscarPorCodigo(@Param() params: ConsultarTicketDto) {
    const ticket = await this.ticketsService.buscarPorCodigo(params.codigo);
    return this.ticketsService.aRespuestaConsulta(ticket);
  }
}
