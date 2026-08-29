import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ConsultarTicketDto } from './consultar-ticket.dto';

const pipe = new ValidationPipe({ transform: true, whitelist: true });
const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: ConsultarTicketDto,
};

describe('ConsultarTicketDto', () => {
  it('acepta exactamente 21 dígitos como texto', async () => {
    await expect(
      pipe.transform({ codigo: '001234567890123456789' }, metadata),
    ).resolves.toMatchObject({ codigo: '001234567890123456789' });
  });

  it.each(['123', '12345678901234567890A', '1234567890123456789012'])(
    'rechaza el código inválido %s',
    async (codigo) => {
      await expect(pipe.transform({ codigo }, metadata)).rejects.toThrow();
    },
  );
});
