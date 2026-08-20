import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../theme/app_radius.dart';
import '../../theme/app_spacing.dart';
import '../../widgets/truck_loading_indicator.dart';
import '../home/home_screen.dart';
import 'login_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _authService = AuthService();
  Widget? _pantalla;

  @override
  void initState() {
    super.initState();
    _verificarSesion();
  }

  Future<void> _verificarSesion() async {
    try {
      final haySesion = await _authService.haySesion();
      if (!haySesion) {
        _mostrar(const LoginScreen());
        return;
      }

      final usuario = await _authService.obtenerPerfil();
      if (usuario.rol == 'CHECADOR') {
        _mostrar(HomeScreen(usuario: usuario));
        return;
      }

      await _cerrarSesionLocal();
      _mostrar(const LoginScreen());
    } catch (error) {
      final codigo = error is DioException ? error.response?.statusCode : null;
      if (codigo == 401) {
        await _cerrarSesionLocal();
      }
      _mostrar(const LoginScreen());
    }
  }

  Future<void> _cerrarSesionLocal() async {
    try {
      await _authService.logout();
    } catch (_) {
      // La comprobación inicial siempre debe terminar en una pantalla usable.
    }
  }

  void _mostrar(Widget pantalla) {
    if (!mounted) return;
    setState(() => _pantalla = pantalla);
  }

  @override
  Widget build(BuildContext context) {
    final pantalla = _pantalla;
    if (pantalla != null) return pantalla;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxHeight < 560;
            final logoSize = compact ? 88.0 : 112.0;

            return Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 360),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ClipRRect(
                        borderRadius: AppRadius.largeBorder,
                        child: Image.asset(
                          'assets/imagenes/indi_logo.png',
                          width: logoSize,
                          height: logoSize,
                          fit: BoxFit.contain,
                        ),
                      ),
                      SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
                      Text(
                        'CONTROL DE ACARREO',
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: compact ? AppSpacing.lg : AppSpacing.xl),
                      const TruckLoadingIndicator(message: 'Cargando...'),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
