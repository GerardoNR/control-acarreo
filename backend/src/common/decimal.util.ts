export function decimalToScaled(value: string | number, scale: number): bigint {
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Decimal inválido');
  const [integer, fraction = ''] = normalized.split('.');
  const padded = `${fraction}${'0'.repeat(scale)}`.slice(0, scale);
  return BigInt(integer) * 10n ** BigInt(scale) + BigInt(padded || '0');
}

export function scaledToDecimal(value: bigint, scale: number): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const divisor = 10n ** BigInt(scale);
  const integer = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(scale, '0');
  return `${negative ? '-' : ''}${integer}.${fraction}`;
}

export function multiplyDecimal(quantity: string, price: string): string {
  const quantityScaled = decimalToScaled(quantity, 3);
  const priceScaled = decimalToScaled(price, 2);
  const cents = (quantityScaled * priceScaled + 500n) / 1000n;
  return scaledToDecimal(cents, 2);
}
