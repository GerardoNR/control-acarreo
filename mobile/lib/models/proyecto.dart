class Proyecto {
  const Proyecto({
    required this.id,
    required this.nombre,
    required this.clave,
    required this.desarrolladora,
    required this.descripcion,
    required this.notaRuta,
    required this.activo,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final int id;
  final String nombre;
  final String? clave;
  final String? desarrolladora;
  final String? descripcion;
  final String? notaRuta;
  final bool activo;
  final String creadoEn;
  final String actualizadoEn;

  factory Proyecto.fromJson(Map<String, dynamic> json) {
    return Proyecto(
      id: json['id'] as int,
      nombre: json['nombre'] as String,
      clave: json['clave'] as String?,
      desarrolladora: json['desarrolladora'] as String?,
      descripcion: json['descripcion'] as String?,
      notaRuta: json['nota_ruta'] as String?,
      activo: json['activo'] as bool,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }
}
