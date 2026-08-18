class RegistrarLlegadaRequest {
  const RegistrarLlegadaRequest({
    this.cantidadLlegada,
    this.observacionesLlegada,
  });

  final double? cantidadLlegada;
  final String? observacionesLlegada;

  Map<String, dynamic> toJson() {
    return {
      if (cantidadLlegada != null) 'cantidad_llegada': cantidadLlegada,
      if (observacionesLlegada != null)
        'observaciones_llegada': observacionesLlegada,
    };
  }
}
