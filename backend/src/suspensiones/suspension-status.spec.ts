import { suspensionEstaVigente } from './suspension-status';

const fecha = new Date('2026-08-26T18:00:00.000Z');
const base = {
  fecha_inicio: '2026-08-20',
  fecha_fin: '2026-08-30',
  indefinida: false,
  finalizada_at: null,
};

describe('suspensión efectiva en America/Monterrey', () => {
  it('mantiene vigente una suspensión temporal incluyendo la fecha final', () => {
    expect(suspensionEstaVigente(base, fecha)).toBe(true);
    expect(
      suspensionEstaVigente({ ...base, fecha_fin: '2026-08-26' }, fecha),
    ).toBe(true);
  });
  it('reanuda automáticamente después de la fecha final', () => {
    expect(
      suspensionEstaVigente({ ...base, fecha_fin: '2026-08-25' }, fecha),
    ).toBe(false);
  });
  it('mantiene una suspensión indefinida y respeta la reanudación manual', () => {
    expect(
      suspensionEstaVigente(
        { ...base, fecha_fin: null, indefinida: true },
        fecha,
      ),
    ).toBe(true);
    expect(
      suspensionEstaVigente({ ...base, finalizada_at: fecha }, fecha),
    ).toBe(false);
  });
  it('no activa una suspensión programada para el futuro', () => {
    expect(
      suspensionEstaVigente({ ...base, fecha_inicio: '2026-08-27' }, fecha),
    ).toBe(false);
  });
});
