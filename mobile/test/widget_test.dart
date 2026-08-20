import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/models/usuario.dart';
import 'package:mobile/screens/auth/login_screen.dart';
import 'package:mobile/screens/home/home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('muestra el formulario de inicio de sesión', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    expect(find.text('CONTROL DE ACARREO'), findsOneWidget);
    expect(find.text('Seguimiento de transporte'), findsOneWidget);
    expect(find.text('INICIAR SESIÓN'), findsOneWidget);
    expect(find.text('Usuario'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
  });

  testWidgets('permite mostrar y ocultar la contraseña', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

    final passwordField = find.widgetWithText(TextField, 'Contraseña');
    expect(tester.widget<TextField>(passwordField).obscureText, isTrue);

    await tester.tap(find.byTooltip('Mostrar contraseña'));
    await tester.pump();
    expect(tester.widget<TextField>(passwordField).obscureText, isFalse);
    expect(find.byTooltip('Ocultar contraseña'), findsOneWidget);
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

    expect(find.text('Registrar salida'), findsOneWidget);
    expect(find.text('Viaje activo'), findsOneWidget);
    expect(find.text('Historial'), findsOneWidget);
    expect(find.text('Cerrar sesión'), findsOneWidget);
  });
}
