class RegistrarSalidaRequest {
  const RegistrarSalidaRequest({
    required this.proyectoId,
    required this.materialId,
    required this.camionId,
    required this.choferId,
    required this.ubicacionOrigenId,
    required this.ubicacionDestinoId,
    required this.cantidadSalida,
    this.observacionesSalida,
  });

  final int proyectoId;
  final int materialId;
  final int camionId;
  final int choferId;
  final int ubicacionOrigenId;
  final int ubicacionDestinoId;
  final double cantidadSalida;
  final String? observacionesSalida;

  Map<String, dynamic> toJson() {
    return {
      'proyecto_id': proyectoId,
      'material_id': materialId,
      'camion_id': camionId,
      'chofer_id': choferId,
      'ubicacion_origen_id': ubicacionOrigenId,
      'ubicacion_destino_id': ubicacionDestinoId,
      'cantidad_salida': cantidadSalida,
      if (observacionesSalida != null)
        'observaciones_salida': observacionesSalida,
    };
  }
}
