import 'package:flutter/material.dart';

import '../../models/viaje.dart';

class DetalleViajeScreen extends StatelessWidget {
  const DetalleViajeScreen({super.key, required this.viaje});

  final Viaje viaje;

  String _fecha(String? valor) {
    if (valor == null) return 'No registrado';
    final fecha = DateTime.tryParse(valor)?.toLocal();
    if (fecha == null) return valor;
    String dos(int numero) => numero.toString().padLeft(2, '0');
    return '${dos(fecha.day)}/${dos(fecha.month)}/${fecha.year} '
        '${dos(fecha.hour)}:${dos(fecha.minute)}';
  }

  String _opcional(String? valor) {
    final limpio = valor?.trim();
    return limpio == null || limpio.isEmpty ? 'No registrado' : limpio;
  }

  String _camion() {
    final numero = viaje.camion.numeroEconomico?.trim();
    return numero == null || numero.isEmpty
        ? viaje.camion.placas
        : '$numero · ${viaje.camion.placas}';
  }

  String _estado(String estado) => switch (estado) {
    'en_transito' => 'En tránsito',
    'completado' => 'Completado',
    'cancelado' => 'Cancelado',
    _ => estado,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle del viaje')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(viaje.folio, style: Theme.of(context).textTheme.headlineSmall),
            Text(_estado(viaje.estado)),
            const Divider(height: 32),
            _dato(context, 'Proyecto', viaje.proyecto.nombre),
            _dato(context, 'Camión', _camion()),
            _dato(context, 'Placas', viaje.camion.placas),
            _dato(context, 'Chofer', viaje.chofer.nombreCompleto),
            _dato(context, 'Material', viaje.material.nombre),
            _dato(context, 'Unidad', viaje.unidadMedida),
            _dato(
              context,
              'Cantidad de salida',
              '${viaje.cantidadSalida} ${viaje.unidadMedida}',
            ),
            _dato(
              context,
              'Cantidad de llegada',
              viaje.cantidadLlegada == null
                  ? 'No registrado'
                  : '${viaje.cantidadLlegada} ${viaje.unidadMedida}',
            ),
            _dato(context, 'Origen', viaje.ubicacionOrigen.nombre),
            _dato(context, 'Destino', viaje.ubicacionDestino.nombre),
            _dato(
              context,
              'Fecha y hora de salida',
              _fecha(viaje.fechaHoraSalida),
            ),
            _dato(
              context,
              'Fecha y hora de llegada',
              _fecha(viaje.fechaHoraLlegada),
            ),
            _dato(
              context,
              'Observaciones de salida',
              _opcional(viaje.observacionesSalida),
            ),
            _dato(
              context,
              'Observaciones de llegada',
              _opcional(viaje.observacionesLlegada),
            ),
            _dato(context, 'Checador de salida', viaje.checadorSalida.nombre),
            _dato(
              context,
              'Checador de llegada',
              viaje.checadorLlegada?.nombre ?? 'No registrado',
            ),
            _dato(
              context,
              'Motivo de cancelación',
              _opcional(viaje.motivoCancelacion),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dato(BuildContext context, String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(etiqueta, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 2),
          Text(valor),
        ],
      ),
    );
  }
}
