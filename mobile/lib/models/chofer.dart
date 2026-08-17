class Chofer {
  const Chofer({
    required this.id,
    required this.nombre,
    required this.apellidoPaterno,
    required this.apellidoMaterno,
    required this.telefono,
    required this.licencia,
    required this.vigenciaLicencia,
    required this.activo,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final int id;
  final String nombre;
  final String? apellidoPaterno;
  final String? apellidoMaterno;
  final String? telefono;
  final String? licencia;
  final String? vigenciaLicencia;
  final bool activo;
  final String creadoEn;
  final String actualizadoEn;

  factory Chofer.fromJson(Map<String, dynamic> json) {
    return Chofer(
      id: json['id'] as int,
      nombre: json['nombre'] as String,
      apellidoPaterno: json['apellido_paterno'] as String?,
      apellidoMaterno: json['apellido_materno'] as String?,
      telefono: json['telefono'] as String?,
      licencia: json['licencia'] as String?,
      vigenciaLicencia: json['vigencia_licencia'] as String?,
      activo: json['activo'] as bool,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }

  String get nombreCompleto =>
      [nombre, apellidoPaterno, apellidoMaterno].whereType<String>().join(' ');
}
