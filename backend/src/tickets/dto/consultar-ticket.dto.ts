import { Matches } from 'class-validator';

export class ConsultarTicketDto {
  @Matches(/^\d{21}$/, {
    message: 'El código de ticket debe contener exactamente 21 dígitos',
  })
  codigo: string;
}
