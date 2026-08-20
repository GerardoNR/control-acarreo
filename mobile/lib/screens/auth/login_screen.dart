import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radius.dart';
import '../../theme/app_spacing.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';
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
  final _usuarioFocus = FocusNode();
  final _passwordFocus = FocusNode();

  bool _cargando = false;
  bool _mostrarPassword = false;

  @override
  void dispose() {
    _usuarioController.dispose();
    _passwordController.dispose();
    _usuarioFocus.dispose();
    _passwordFocus.dispose();
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
      body: SafeArea(
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxHeight < 650;
              final horizontalPadding = constraints.maxWidth < 360
                  ? AppSpacing.md
                  : AppSpacing.lg;

              return SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  horizontalPadding,
                  compact ? AppSpacing.md : AppSpacing.lg,
                  horizontalPadding,
                  AppSpacing.lg,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: 440,
                      minHeight:
                          (constraints.maxHeight -
                                  (compact ? AppSpacing.md : AppSpacing.lg) -
                                  AppSpacing.lg)
                              .clamp(0, double.infinity),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _LoginBrand(compact: compact),
                        SizedBox(
                          height: compact ? AppSpacing.lg : AppSpacing.xl,
                        ),
                        AppCard(
                          padding: EdgeInsets.all(
                            constraints.maxWidth < 360
                                ? AppSpacing.md
                                : AppSpacing.lg,
                          ),
                          child: AutofillGroup(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                TextField(
                                  controller: _usuarioController,
                                  focusNode: _usuarioFocus,
                                  enabled: !_cargando,
                                  autocorrect: false,
                                  autofillHints: const [AutofillHints.username],
                                  textInputAction: TextInputAction.next,
                                  onSubmitted: (_) =>
                                      _passwordFocus.requestFocus(),
                                  decoration: const InputDecoration(
                                    labelText: 'Usuario',
                                    prefixIcon: Icon(Icons.person_outline),
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.md),
                                TextField(
                                  controller: _passwordController,
                                  focusNode: _passwordFocus,
                                  enabled: !_cargando,
                                  obscureText: !_mostrarPassword,
                                  enableSuggestions: false,
                                  autocorrect: false,
                                  autofillHints: const [AutofillHints.password],
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => _iniciarSesion(),
                                  decoration: InputDecoration(
                                    labelText: 'Contraseña',
                                    prefixIcon: const Icon(Icons.lock_outline),
                                    suffixIcon: IconButton(
                                      tooltip: _mostrarPassword
                                          ? 'Ocultar contraseña'
                                          : 'Mostrar contraseña',
                                      onPressed: _cargando
                                          ? null
                                          : () => setState(
                                              () => _mostrarPassword =
                                                  !_mostrarPassword,
                                            ),
                                      icon: Icon(
                                        _mostrarPassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.lg),
                                PrimaryButton(
                                  label: 'INICIAR SESIÓN',
                                  onPressed: _iniciarSesion,
                                  isLoading: _cargando,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _LoginBrand extends StatelessWidget {
  const _LoginBrand({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final logoSize = compact ? 88.0 : 108.0;

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: AppRadius.largeBorder,
            boxShadow: [
              BoxShadow(
                color: colors.primary.withValues(alpha: 0.18),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: AppRadius.largeBorder,
            child: Image.asset(
              'assets/imagenes/indi_logo.png',
              width: logoSize,
              height: logoSize,
              fit: BoxFit.contain,
            ),
          ),
        ),
        SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
        Text(
          'CONTROL DE ACARREO',
          style: Theme.of(context).textTheme.headlineMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          'Seguimiento de transporte',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: colors.textSecondary),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
