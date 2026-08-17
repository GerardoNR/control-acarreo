import 'camion.dart';
import 'chofer.dart';
import 'material.dart';
import 'proyecto.dart';
import 'ubicacion.dart';

class PersonaViaje {
  const PersonaViaje({required this.id, required this.nombre});

  final int id;
  final String nombre;

  factory PersonaViaje.fromJson(Map<String, dynamic> json) {
    return PersonaViaje(
      id: json['id'] as int,
      nombre: json['nombre'] as String,
    );
  }
}

class Viaje {
  const Viaje({
    required this.id,
    required this.idLegacy,
    required this.folio,
    required this.proyecto,
    required this.material,
    required this.camion,
    required this.chofer,
    required this.ubicacionOrigen,
    required this.ubicacionDestino,
    required this.checadorSalida,
    required this.checadorLlegada,
    required this.administradorCancelacion,
    required this.checadorOrigen,
    required this.checadorDestino,
    required this.cantidadSalida,
    required this.cantidadLlegada,
    required this.unidadMedida,
    required this.fechaHoraSalida,
    required this.fechaHoraLlegada,
    required this.fechaHoraCancelacion,
    required this.estado,
    required this.observacionesSalida,
    required this.observacionesLlegada,
    required this.motivoCancelacion,
    required this.cantidadM3,
    required this.folioBanco,
    required this.fechaHoraOrigen,
    required this.fechaHoraDestino,
    required this.nota,
    required this.impreso,
    required this.fechaImpresion,
    required this.dispositivoOrigenId,
    required this.dispositivoDestinoId,
    required this.sincronizado,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final String id;
  final int? idLegacy;
  final String folio;
  final Proyecto proyecto;
  final Material material;
  final Camion camion;
  final Chofer chofer;
  final Ubicacion ubicacionOrigen;
  final Ubicacion ubicacionDestino;
  final PersonaViaje checadorSalida;
  final PersonaViaje? checadorLlegada;
  final PersonaViaje? administradorCancelacion;
  final PersonaViaje? checadorOrigen;
  final PersonaViaje? checadorDestino;
  final String cantidadSalida;
  final String? cantidadLlegada;
  final String unidadMedida;
  final String fechaHoraSalida;
  final String? fechaHoraLlegada;
  final String? fechaHoraCancelacion;
  final String estado;
  final String? observacionesSalida;
  final String? observacionesLlegada;
  final String? motivoCancelacion;
  final String? cantidadM3;
  final String? folioBanco;
  final String? fechaHoraOrigen;
  final String? fechaHoraDestino;
  final String? nota;
  final bool impreso;
  final String? fechaImpresion;
  final String? dispositivoOrigenId;
  final String? dispositivoDestinoId;
  final bool sincronizado;
  final String creadoEn;
  final String actualizadoEn;

  factory Viaje.fromJson(Map<String, dynamic> json) {
    return Viaje(
      id: json['id'] as String,
      idLegacy: json['id_legacy'] as int?,
      folio: json['folio'] as String,
      proyecto: Proyecto.fromJson(json['proyecto'] as Map<String, dynamic>),
      material: Material.fromJson(json['material'] as Map<String, dynamic>),
      camion: Camion.fromJson(json['camion'] as Map<String, dynamic>),
      chofer: Chofer.fromJson(json['chofer'] as Map<String, dynamic>),
      ubicacionOrigen: Ubicacion.fromJson(
        json['ubicacion_origen'] as Map<String, dynamic>,
      ),
      ubicacionDestino: Ubicacion.fromJson(
        json['ubicacion_destino'] as Map<String, dynamic>,
      ),
      checadorSalida: PersonaViaje.fromJson(
        json['checador_salida'] as Map<String, dynamic>,
      ),
      checadorLlegada: _personaOpcional(json['checador_llegada']),
      administradorCancelacion: _personaOpcional(
        json['administrador_cancelacion'],
      ),
      checadorOrigen: _personaOpcional(json['checador_origen']),
      checadorDestino: _personaOpcional(json['checador_destino']),
      cantidadSalida: json['cantidad_salida'] as String,
      cantidadLlegada: json['cantidad_llegada'] as String?,
      unidadMedida: json['unidad_medida'] as String,
      fechaHoraSalida: json['fecha_hora_salida'] as String,
      fechaHoraLlegada: json['fecha_hora_llegada'] as String?,
      fechaHoraCancelacion: json['fecha_hora_cancelacion'] as String?,
      estado: json['estado'] as String,
      observacionesSalida: json['observaciones_salida'] as String?,
      observacionesLlegada: json['observaciones_llegada'] as String?,
      motivoCancelacion: json['motivo_cancelacion'] as String?,
      cantidadM3: json['cantidad_m3'] as String?,
      folioBanco: json['folio_banco'] as String?,
      fechaHoraOrigen: json['fecha_hora_origen'] as String?,
      fechaHoraDestino: json['fecha_hora_destino'] as String?,
      nota: json['nota'] as String?,
      impreso: json['impreso'] as bool? ?? false,
      fechaImpresion: json['fecha_impresion'] as String?,
      dispositivoOrigenId: json['dispositivo_origen_id'] as String?,
      dispositivoDestinoId: json['dispositivo_destino_id'] as String?,
      sincronizado: json['sincronizado'] as bool? ?? false,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }

  static PersonaViaje? _personaOpcional(Object? json) {
    if (json == null) return null;
    return PersonaViaje.fromJson(json as Map<String, dynamic>);
  }
}
