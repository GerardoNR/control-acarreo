import { calcularAcarreoEscalonado } from './calculos-acarreo';

describe('calcularAcarreoEscalonado', () => {
  it('reproduce la fórmula económica confirmada por el Excel real', () => {
    expect(
      calcularAcarreoEscalonado({
        capacidadM3: '15.600',
        distanciaPavimentoKm: '3.500',
        distanciaTotalKm: '3.500',
        precioPrimerKm: '12.0000',
        precioKmSubsecuente: '5.4000',
      }),
    ).toEqual({
      m3Km: '54.60',
      costePrimerKm: '187.20',
      costeKmSubsecuente: '210.60',
      importe: '397.80',
    });
  });

  it('no genera kilómetros subsecuentes para distancias menores a uno', () => {
    expect(
      calcularAcarreoEscalonado({
        capacidadM3: '10.000',
        distanciaPavimentoKm: '0.750',
        distanciaTotalKm: '0.750',
        precioPrimerKm: '12.0000',
        precioKmSubsecuente: '5.4000',
      }),
    ).toMatchObject({
      costePrimerKm: '120.00',
      costeKmSubsecuente: '0.00',
      importe: '120.00',
    });
  });
});
