import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../models/usuario.dart';
import '../services/auth_service.dart';

void main() {
  runApp(const AuthSmokeTestApp());
}

class AuthSmokeTestApp extends StatelessWidget {
  const AuthSmokeTestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Prueba de autenticación',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: const AuthSmokeTestScreen(),
    );
  }
}

class AuthSmokeTestScreen extends StatefulWidget {
  const AuthSmokeTestScreen({super.key});

  @override
  State<AuthSmokeTestScreen> createState() => _AuthSmokeTestScreenState();
}

class _AuthSmokeTestScreenState extends State<AuthSmokeTestScreen> {
  final _usuarioController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  String _resultado = 'Listo para probar la autenticación.';
  bool _procesando = false;

  @override
  void dispose() {
    _usuarioController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _iniciarSesion() async {
    final usuario = _usuarioController.text.trim();
    final password = _passwordController.text;

    if (usuario.isEmpty || password.isEmpty) {
      _mostrarResultado('Captura usuario y contraseña.');
      return;
    }

    _iniciarOperacion('Iniciando sesión...');
    try {
      await _authService.login(usuario: usuario, password: password);
      final perfil = await _authService.obtenerPerfil();
      final sesionGuardada = await _authService.haySesion();
      _mostrarResultado(
        'LOGIN CORRECTO\n\n'
        '${_formatearPerfil(perfil)}\n\n'
        'Sesión guardada: ${sesionGuardada ? 'SÍ' : 'NO'}',
      );
    } catch (error) {
      _mostrarResultado(_formatearError('Error de login', error));
    }
  }

  Future<void> _probarProfile() async {
    _iniciarOperacion('Consultando profile con el token guardado...');
    try {
      final perfil = await _authService.obtenerPerfil();
      final sesionGuardada = await _authService.haySesion();
      _mostrarResultado(
        'PROFILE CORRECTO\n\n'
        '${_formatearPerfil(perfil)}\n\n'
        'Sesión guardada: ${sesionGuardada ? 'SÍ' : 'NO'}',
      );
    } catch (error) {
      _mostrarResultado(_formatearError('Error al consultar profile', error));
    }
  }

  Future<void> _cerrarSesion() async {
    _iniciarOperacion('Cerrando sesión...');
    try {
      await _authService.logout();
      final sesionGuardada = await _authService.haySesion();
      _mostrarResultado(
        'SESIÓN TERMINADA\n\n'
        'Token eliminado: ${sesionGuardada ? 'NO' : 'SÍ'}',
      );
    } catch (error) {
      _mostrarResultado(_formatearError('Error al cerrar sesión', error));
    }
  }

  void _iniciarOperacion(String mensaje) {
    setState(() {
      _procesando = true;
      _resultado = mensaje;
    });
  }

  void _mostrarResultado(String mensaje) {
    if (!mounted) return;
    setState(() {
      _procesando = false;
      _resultado = mensaje;
    });
  }

  String _formatearPerfil(Usuario perfil) {
    return 'ID: ${perfil.id}\n'
        'Nombre: ${perfil.nombre}\n'
        'Usuario: ${perfil.usuario}\n'
        'Rol: ${perfil.rol}';
  }

  String _formatearError(String contexto, Object error) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      if (codigo != null) return '$contexto (HTTP $codigo).';
      return '$contexto: no fue posible conectar con el backend.';
    }
    return '$contexto: ${error.runtimeType}.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Auth smoke test')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _usuarioController,
                enabled: !_procesando,
                decoration: const InputDecoration(labelText: 'Usuario'),
                textInputAction: TextInputAction.next,
                autocorrect: false,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                enabled: !_procesando,
                decoration: const InputDecoration(labelText: 'Contraseña'),
                obscureText: true,
                enableSuggestions: false,
                autocorrect: false,
                onSubmitted: (_) {
                  if (!_procesando) _iniciarSesion();
                },
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _procesando ? null : _iniciarSesion,
                child: const Text('INICIAR SESIÓN'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: _procesando ? null : _probarProfile,
                child: const Text('PROBAR PROFILE'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: _procesando ? null : _cerrarSesion,
                child: const Text('CERRAR SESIÓN'),
              ),
              const SizedBox(height: 20),
              if (_procesando) const LinearProgressIndicator(),
              const SizedBox(height: 12),
              SelectableText(_resultado),
            ],
          ),
        ),
      ),
    );
  }
}
