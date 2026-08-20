import 'package:flutter/material.dart';

@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    required this.success,
    required this.warning,
    required this.error,
    required this.info,
  });

  static const light = AppColors(
    primary: Color(0xFF2563EB),
    primaryDark: Color(0xFF1D4ED8),
    primaryLight: Color(0xFFDBEAFE),
    background: Color(0xFFF8FAFC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF1F5F9),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF475569),
    border: Color(0xFFCBD5E1),
    success: Color(0xFF16A34A),
    warning: Color(0xFFF59E0B),
    error: Color(0xFFDC2626),
    info: Color(0xFF2563EB),
  );

  static const dark = AppColors(
    primary: Color(0xFF4F8CFF),
    primaryDark: Color(0xFF2563EB),
    primaryLight: Color(0xFF1E3554),
    background: Color(0xFF1A1D22),
    surface: Color(0xFF232A33),
    surfaceVariant: Color(0xFF2B3440),
    textPrimary: Color(0xFFF3F4F6),
    textSecondary: Color(0xFFB8C0CC),
    border: Color(0xFF3B4654),
    success: Color(0xFF4ADE80),
    warning: Color(0xFFFBBF24),
    error: Color(0xFFF87171),
    info: Color(0xFF60A5FA),
  );

  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final Color success;
  final Color warning;
  final Color error;
  final Color info;

  static AppColors of(BuildContext context) {
    return Theme.of(context).extension<AppColors>() ?? light;
  }

  @override
  AppColors copyWith({
    Color? primary,
    Color? primaryDark,
    Color? primaryLight,
    Color? background,
    Color? surface,
    Color? surfaceVariant,
    Color? textPrimary,
    Color? textSecondary,
    Color? border,
    Color? success,
    Color? warning,
    Color? error,
    Color? info,
  }) {
    return AppColors(
      primary: primary ?? this.primary,
      primaryDark: primaryDark ?? this.primaryDark,
      primaryLight: primaryLight ?? this.primaryLight,
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      border: border ?? this.border,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      error: error ?? this.error,
      info: info ?? this.info,
    );
  }

  @override
  AppColors lerp(covariant AppColors? other, double t) {
    if (other == null) return this;
    return AppColors(
      primary: Color.lerp(primary, other.primary, t)!,
      primaryDark: Color.lerp(primaryDark, other.primaryDark, t)!,
      primaryLight: Color.lerp(primaryLight, other.primaryLight, t)!,
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      border: Color.lerp(border, other.border, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      error: Color.lerp(error, other.error, t)!,
      info: Color.lerp(info, other.info, t)!,
    );
  }
}
