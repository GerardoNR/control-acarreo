describe('cálculos operativos de orden', () => {
  const calcular = (solicitado: number, cantidades: number[]) => {
    const transportado = cantidades.reduce((a, b) => a + b, 0);
    return {
      transportado,
      pendiente: Math.max(solicitado - transportado, 0),
      excedente: Math.max(transportado - solicitado, 0),
      avance: Number(((transportado / solicitado) * 100).toFixed(2)),
    };
  };
  it('usa cantidades reales aunque los camiones tengan capacidades distintas', () => {
    const resultado = calcular(1800, [
      14,
      16,
      18,
      ...Array(42).fill(13.857142857),
    ]);
    expect(resultado.transportado).toBeCloseTo(630, 6);
    expect(resultado.pendiente).toBeCloseTo(1170, 6);
    expect(resultado.avance).toBe(35);
  });
  it('conserva excedente sin pendiente negativo', () =>
    expect(calcular(100, [60, 50])).toEqual({
      transportado: 110,
      pendiente: 0,
      excedente: 10,
      avance: 110,
    }));
});
