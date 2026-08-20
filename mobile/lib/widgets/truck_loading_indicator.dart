import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class TruckLoadingIndicator extends StatefulWidget {
  const TruckLoadingIndicator({
    super.key,
    this.message = 'Cargando...',
    this.width,
  });

  final String? message;
  final double? width;

  @override
  State<TruckLoadingIndicator> createState() => _TruckLoadingIndicatorState();
}

class _TruckLoadingIndicatorState extends State<TruckLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _position;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2100),
    );
    _position = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Semantics(
      label: widget.message ?? 'Cargando',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: widget.width ?? 240,
            minWidth: 120,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 34,
                width: double.infinity,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    const truckSize = 24.0;
                    final travel = (constraints.maxWidth - truckSize).clamp(
                      0.0,
                      double.infinity,
                    );
                    return AnimatedBuilder(
                      animation: _position,
                      builder: (context, child) => Stack(
                        alignment: Alignment.bottomLeft,
                        children: [
                          Positioned(
                            left: 0,
                            right: 0,
                            bottom: 1,
                            child: Container(height: 2, color: colors.border),
                          ),
                          Positioned(
                            left: travel * _position.value,
                            bottom: 3,
                            child: child!,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.local_shipping_rounded,
                        size: truckSize,
                        color: colors.primary,
                      ),
                    );
                  },
                ),
              ),
              if (widget.message != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(
                  widget.message!,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
