import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class AppStateView extends StatelessWidget {
  const AppStateView.loading({super.key, required this.message})
    : onRetry = null,
      loading = true;

  const AppStateView.error({
    super.key,
    required this.message,
    required this.onRetry,
  }) : loading = false;

  final String message;
  final VoidCallback? onRetry;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (loading)
              const CircularProgressIndicator()
            else
              Icon(Icons.error_outline, size: 42, color: colors.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: loading ? colors.textSecondary : colors.textPrimary,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.md),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('REINTENTAR'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
