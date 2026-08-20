import 'package:flutter/material.dart';

import '../../models/usuario.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radius.dart';
import '../../theme/app_spacing.dart';
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

  String get _saludo {
    final hora = DateTime.now().hour;

    if (hora < 12) {
      return 'BUENOS DÍAS';
    }

    if (hora < 19) {
      return 'BUENAS TARDES';
    }

    return 'BUENAS NOCHES';
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.mobileHorizontal,
                AppSpacing.lg,
                AppSpacing.mobileHorizontal,
                AppSpacing.lg,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ENCABEZADO
                      Text(
                        _saludo,
                        style: textTheme.labelMedium?.copyWith(
                          color: colors.primary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),

                      Text(
                        'Hola, ${widget.usuario.nombre}',
                        style: textTheme.headlineMedium,
                      ),

                      const SizedBox(height: AppSpacing.xxs),

                      Text(
                        'Control de acarreo',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),

                      const SizedBox(height: AppSpacing.sm),

                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: colors.surfaceVariant,
                            borderRadius: AppRadius.largeBorder,
                            border: Border.all(color: colors.border),
                          ),
                          child: Text(
                            widget.usuario.rol,
                            style: textTheme.labelMedium?.copyWith(
                              color: colors.textSecondary,
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: AppSpacing.xl),

                      // OPERACIÓN PRINCIPAL
                      Text(
                        'OPERACIÓN PRINCIPAL',
                        style: textTheme.labelMedium?.copyWith(
                          color: colors.textSecondary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),

                      const SizedBox(height: AppSpacing.sm),

                      _HomeActionCard(
                        icon: Icons.local_shipping_outlined,
                        title: 'Registrar salida',
                        subtitle: 'Registrar viaje e imprimir ticket',
                        isPrimary: true,
                        onTap: () =>
                            _abrirPantalla(const RegistrarSalidaScreen()),
                      ),

                      const SizedBox(height: AppSpacing.xl),

                      // OPCIONES SECUNDARIAS
                      Text(
                        'OTRAS OPCIONES',
                        style: textTheme.labelMedium?.copyWith(
                          color: colors.textSecondary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),

                      const SizedBox(height: AppSpacing.sm),

                      _HomeActionCard(
                        icon: Icons.pending_actions_outlined,
                        title: 'Viaje activo',
                        subtitle: 'Consultar viaje y registrar llegada',
                        onTap: () => _abrirPantalla(const ViajeActivoScreen()),
                      ),

                      const SizedBox(height: AppSpacing.sm),

                      _HomeActionCard(
                        icon: Icons.history,
                        title: 'Historial',
                        subtitle: 'Consultar viajes anteriores',
                        onTap: () => _abrirPantalla(const HistorialScreen()),
                      ),

                      const SizedBox(height: AppSpacing.xl),

                      Divider(color: colors.border),

                      const SizedBox(height: AppSpacing.sm),

                      // CERRAR SESIÓN
                      OutlinedButton.icon(
                        onPressed: _cerrandoSesion ? null : _cerrarSesion,
                        icon: _cerrandoSesion
                            ? const SizedBox.square(
                                dimension: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.logout, size: 20),
                        label: Text(
                          _cerrandoSesion
                              ? 'Cerrando sesión...'
                              : 'Cerrar sesión',
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: colors.textSecondary,
                          side: BorderSide(color: colors.border),
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
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  const _HomeActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.isPrimary = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final backgroundColor = isPrimary ? colors.primary : colors.surface;

    final foregroundColor = isPrimary
        ? colorScheme.onPrimary
        : colors.textPrimary;

    final secondaryForegroundColor = isPrimary
        ? colorScheme.onPrimary.withValues(alpha: 0.84)
        : colors.textSecondary;

    final iconBackgroundColor = isPrimary
        ? colorScheme.onPrimary.withValues(alpha: 0.14)
        : colors.primaryLight;

    final iconColor = isPrimary ? colorScheme.onPrimary : colors.primary;

    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: AppRadius.cardBorder,
          border: isPrimary ? null : Border.all(color: colors.border),
          boxShadow: isPrimary || isDark
              ? const []
              : const [
                  BoxShadow(
                    color: Color(0x140F172A),
                    blurRadius: 12,
                    offset: Offset(0, 3),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: AppRadius.cardBorder,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: iconBackgroundColor,
                      borderRadius: AppRadius.mediumBorder,
                    ),
                    alignment: Alignment.center,
                    child: Icon(icon, size: 24, color: iconColor),
                  ),

                  const SizedBox(width: AppSpacing.md),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: textTheme.titleMedium?.copyWith(
                            color: foregroundColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),

                        const SizedBox(height: AppSpacing.xxs),

                        Text(
                          subtitle,
                          style: textTheme.bodyMedium?.copyWith(
                            color: secondaryForegroundColor,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: AppSpacing.sm),

                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 17,
                    color: secondaryForegroundColor,
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
