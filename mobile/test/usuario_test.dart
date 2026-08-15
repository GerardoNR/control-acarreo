import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/usuario.dart';

void main() {
  test('construye el perfil con los campos de auth/profile', () {
    final usuario = Usuario.fromJson({
      'id': 7,
      'nombre': 'Ana Pérez',
      'usuario': 'aperez',
      'rol': 'CHECADOR',
    });

    expect(usuario.id, 7);
    expect(usuario.nombre, 'Ana Pérez');
    expect(usuario.usuario, 'aperez');
    expect(usuario.rol, 'CHECADOR');
  });
}
