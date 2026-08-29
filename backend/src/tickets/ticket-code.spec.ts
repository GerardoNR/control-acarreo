import {
  construirCodigoTicket,
  generarSufijoTicket,
  LONGITUD_CODIGO_TICKET,
} from './ticket-code';

describe('Código de ticket', () => {
  it('construye exactamente 21 dígitos con la hora de Monterrey', () => {
    const fecha = new Date('2026-08-29T04:15:42.000Z');

    const codigo = construirCodigoTicket(fecha, '00142', '0007');

    expect(codigo).toBe('260828001422215420007');
    expect(codigo).toHaveLength(LONGITUD_CODIGO_TICKET);
    expect(codigo).toMatch(/^\d{21}$/);
  });

  it('conserva ceros iniciales de unidad y sufijo', () => {
    const codigo = construirCodigoTicket(
      new Date('2026-08-28T15:15:42.000Z'),
      '00001',
      '0000',
    );

    expect(codigo.slice(6, 11)).toBe('00001');
    expect(codigo.slice(-4)).toBe('0000');
  });

  it.each([
    ['1234', '0000'],
    ['123456', '0000'],
    ['12A45', '0000'],
    ['12345', '999'],
    ['12345', '10000'],
  ])('rechaza unidad o sufijo inválidos', (unidad, sufijo) => {
    expect(() => construirCodigoTicket(new Date(), unidad, sufijo)).toThrow();
  });

  it('genera un sufijo seguro de cuatro dígitos', () => {
    expect(generarSufijoTicket()).toMatch(/^\d{4}$/);
  });
});
