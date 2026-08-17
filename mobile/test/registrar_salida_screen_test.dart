import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/viajes/registrar_salida_screen.dart';

void main() {
  test('normaliza cantidades con punto o coma decimal', () {
    expect(normalizarCantidadSalida('14'), 14);
    expect(normalizarCantidadSalida('14.5'), 14.5);
    expect(normalizarCantidadSalida('14.500'), 14.5);
    expect(normalizarCantidadSalida(' 14,5 '), 14.5);
  });

  test('rechaza cantidades inválidas', () {
    for (final valor in ['', '0', '-1', 'abc', '14.5001', '14.', ',5']) {
      expect(
        normalizarCantidadSalida(valor),
        isNull,
        reason: 'Debía rechazar "$valor"',
      );
    }
  });
}
