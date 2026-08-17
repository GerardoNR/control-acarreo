class Material {
  const Material({
    required this.id,
    required this.nombre,
    required this.unidadMedida,
    required this.descripcion,
    required this.activo,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final int id;
  final String nombre;
  final String unidadMedida;
  final String? descripcion;
  final bool activo;
  final String creadoEn;
  final String actualizadoEn;

  factory Material.fromJson(Map<String, dynamic> json) {
    return Material(
      id: json['id'] as int,
      nombre: json['nombre'] as String,
      unidadMedida: json['unidad_medida'] as String,
      descripcion: json['descripcion'] as String?,
      activo: json['activo'] as bool,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }
}
