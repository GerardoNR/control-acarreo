import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/models/usuario.dart';
import 'package:mobile/screens/home/home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('muestra el formulario de inicio de sesión', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    expect(find.text('Control de Acarreo'), findsOneWidget);
    expect(find.text('Iniciar sesión'), findsNWidgets(2));
    expect(find.text('Usuario'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
  });

  testWidgets('Home muestra las acciones principales del CHECADOR', (
    tester,
  ) async {
    const usuario = Usuario(
      id: 1,
      nombre: 'Juan Pérez',
      usuario: 'juanp',
      rol: 'CHECADOR',
    );

    await tester.pumpWidget(
      const MaterialApp(home: HomeScreen(usuario: usuario)),
    );

    expect(find.text('REGISTRAR SALIDA'), findsOneWidget);
    expect(find.text('VIAJE ACTIVO / REGISTRAR LLEGADA'), findsOneWidget);
    expect(find.text('HISTORIAL DE VIAJES'), findsOneWidget);
    expect(find.text('Cerrar sesión'), findsOneWidget);
  });
}
