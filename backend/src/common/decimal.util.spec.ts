import {
  decimalToScaled,
  multiplyDecimal,
  scaledToDecimal,
} from './decimal.util';
describe('aritmética decimal económica', () => {
  it('calcula 14.5 × 85 sin usar punto flotante', () =>
    expect(multiplyDecimal('14.500', '85.00')).toBe('1232.50'));
  it('suma pagos parciales en centavos exactos', () => {
    const facturado = decimalToScaled('10000.00', 2);
    const pagado =
      decimalToScaled('4000.00', 2) + decimalToScaled('3000.00', 2);
    expect(scaledToDecimal(facturado - pagado, 2)).toBe('3000.00');
  });
});
