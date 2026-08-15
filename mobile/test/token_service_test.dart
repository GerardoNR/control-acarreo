import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/token_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('guarda, obtiene y elimina el access token', () async {
    final service = TokenService();

    expect(await service.hayToken(), isFalse);

    await service.guardarToken('token-de-prueba');
    expect(await service.obtenerToken(), 'token-de-prueba');
    expect(await service.hayToken(), isTrue);

    await service.eliminarToken();
    expect(await service.obtenerToken(), isNull);
    expect(await service.hayToken(), isFalse);
  });
}
