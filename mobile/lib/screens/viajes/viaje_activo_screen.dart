import 'package:flutter/material.dart';

class ViajeActivoScreen extends StatelessWidget {
  const ViajeActivoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Viaje activo / Llegada')),
      body: const SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.pending_actions_outlined, size: 56),
                SizedBox(height: 16),
                Text('Viaje activo / Llegada'),
                SizedBox(height: 8),
                Text('Funcionalidad disponible en FASE 8 y 9'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
