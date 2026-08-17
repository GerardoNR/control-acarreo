import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usuarioController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  bool _cargando = false;
  bool _mostrarPassword = false;

  @override
  void dispose() {
    _usuarioController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _iniciarSesion() async {
    if (_cargando) return;

    final usuario = _usuarioController.text.trim();
    final password = _passwordController.text;
    if (usuario.isEmpty || password.isEmpty) {
      _mostrarError('Captura usuario y contraseña.');
      return;
    }

    setState(() => _cargando = true);
    var tokenGuardado = false;

    try {
      await _authService.login(usuario: usuario, password: password);
      tokenGuardado = true;
      final perfil = await _authService.obtenerPerfil();

      if (perfil.rol != 'CHECADOR') {
        await _authService.logout();
        tokenGuardado = false;
        if (!mounted) return;
        _mostrarError(
          'Esta aplicación móvil está disponible únicamente para usuarios '
          'CHECADOR.',
        );
        return;
      }

      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => HomeScreen(usuario: perfil)),
      );
    } catch (error) {
      final codigo = error is DioException ? error.response?.statusCode : null;
      if (tokenGuardado && codigo == 401) {
        await _authService.logout();
      }
      if (!mounted) return;
      _mostrarError(_mensajeDeError(error));
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  String _mensajeDeError(Object error) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      if (codigo == 401 || codigo == 403) {
        return 'Usuario o contraseña incorrectos.';
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return 'No fue posible conectar con el backend. Intenta nuevamente.';
      }
    }
    return 'El servidor devolvió una respuesta inesperada. Intenta nuevamente.';
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(mensaje)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Control de Acarreo')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Iniciar sesión',
                    style: Theme.of(context).textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _usuarioController,
                    enabled: !_cargando,
                    autocorrect: false,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Usuario',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    enabled: !_cargando,
                    obscureText: !_mostrarPassword,
                    enableSuggestions: false,
                    autocorrect: false,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _iniciarSesion(),
                    decoration: InputDecoration(
                      labelText: 'Contraseña',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        tooltip: _mostrarPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña',
                        onPressed: _cargando
                            ? null
                            : () => setState(
                                () => _mostrarPassword = !_mostrarPassword,
                              ),
                        icon: Icon(
                          _mostrarPassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _cargando ? null : _iniciarSesion,
                    child: _cargando
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Iniciar sesión'),
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
