import 'package:flutter/material.dart';

import '../../models/usuario.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../viajes/historial_screen.dart';
import '../viajes/registrar_salida_screen.dart';
import '../viajes/viaje_activo_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.usuario});

  final Usuario usuario;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _authService = AuthService();
  bool _cerrandoSesion = false;

  Future<void> _cerrarSesion() async {
    if (_cerrandoSesion) return;
    setState(() => _cerrandoSesion = true);
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  void _abrirPantalla(Widget pantalla) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => pantalla));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Control de Acarreo')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Bienvenido, ${widget.usuario.nombre}',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${widget.usuario.usuario} · ${widget.usuario.rol}',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton.icon(
                    onPressed: () =>
                        _abrirPantalla(const RegistrarSalidaScreen()),
                    icon: const Icon(Icons.local_shipping_outlined, size: 30),
                    label: const Text('REGISTRAR SALIDA'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(76),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _abrirPantalla(const ViajeActivoScreen()),
                    icon: const Icon(Icons.pending_actions_outlined, size: 30),
                    label: const Text('VIAJE ACTIVO / REGISTRAR LLEGADA'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(76),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _abrirPantalla(const HistorialScreen()),
                    icon: const Icon(Icons.history, size: 30),
                    label: const Text('HISTORIAL DE VIAJES'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(76),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                    ),
                  ),
                  const SizedBox(height: 32),
                  OutlinedButton.icon(
                    onPressed: _cerrandoSesion ? null : _cerrarSesion,
                    icon: const Icon(Icons.logout),
                    label: Text(
                      _cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
