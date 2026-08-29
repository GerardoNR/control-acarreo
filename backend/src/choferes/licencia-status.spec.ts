import { EstadoLicencia, obtenerEstadoLicencia } from './licencia-status';

describe('estado de licencia', () => {
  const ahora = new Date('2026-08-26T18:00:00Z');

  it.each([
    ['2026-10-18', EstadoLicencia.VIGENTE],
    ['2026-09-10', EstadoLicencia.POR_VENCER],
    ['2026-08-27', EstadoLicencia.POR_VENCER],
    ['2026-08-26', EstadoLicencia.POR_VENCER],
    ['2026-08-25', EstadoLicencia.VENCIDA],
    [null, EstadoLicencia.SIN_FECHA],
  ])('clasifica %s como %s', (vigencia, esperado) => {
    expect(obtenerEstadoLicencia(vigencia, ahora)).toBe(esperado);
  });
});
