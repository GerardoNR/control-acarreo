import 'proyecto.dart';

class Ubicacion {
  const Ubicacion({
    required this.id,
    required this.proyecto,
    required this.nombre,
    required this.tipo,
    required this.descripcion,
    required this.referencia,
    required this.activo,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final int id;
  final Proyecto proyecto;
  final String nombre;
  final String tipo;
  final String? descripcion;
  final String? referencia;
  final bool activo;
  final String creadoEn;
  final String actualizadoEn;

  factory Ubicacion.fromJson(Map<String, dynamic> json) {
    return Ubicacion(
      id: json['id'] as int,
      proyecto: Proyecto.fromJson(json['proyecto'] as Map<String, dynamic>),
      nombre: json['nombre'] as String,
      tipo: json['tipo'] as String,
      descripcion: json['descripcion'] as String?,
      referencia: json['referencia'] as String?,
      activo: json['activo'] as bool,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }
}
