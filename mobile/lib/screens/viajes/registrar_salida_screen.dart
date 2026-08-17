import 'package:flutter/material.dart';

class RegistrarSalidaScreen extends StatelessWidget {
  const RegistrarSalidaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar salida')),
      body: const SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.local_shipping_outlined, size: 56),
                SizedBox(height: 16),
                Text('Registrar salida'),
                SizedBox(height: 8),
                Text('Funcionalidad disponible en FASE 7'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
