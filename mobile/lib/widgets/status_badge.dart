import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';

enum TripStatus { inTransit, completed, cancelled }

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final TripStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final (label, icon, color) = switch (status) {
      TripStatus.inTransit => (
        'EN TRÁNSITO',
        Icons.local_shipping,
        colors.warning,
      ),
      TripStatus.completed => (
        'COMPLETADO',
        Icons.check_circle,
        colors.success,
      ),
      TripStatus.cancelled => ('CANCELADO', Icons.cancel, colors.error),
    };

    return Semantics(
      label: 'Estado: $label',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.14),
          borderRadius: AppRadius.smallBorder,
          border: Border.all(color: color.withValues(alpha: 0.55)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xxs,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: AppSpacing.xxs),
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
