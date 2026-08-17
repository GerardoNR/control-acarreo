class Camion {
  const Camion({
    required this.id,
    required this.placas,
    required this.numeroEconomico,
    required this.nfcTagUid,
    required this.capacidadM3,
    required this.tipoCamion,
    required this.marca,
    required this.modelo,
    required this.anio,
    required this.activo,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  final int id;
  final String placas;
  final String? numeroEconomico;
  final String nfcTagUid;
  final String capacidadM3;
  final String? tipoCamion;
  final String? marca;
  final String? modelo;
  final int? anio;
  final bool activo;
  final String creadoEn;
  final String actualizadoEn;

  factory Camion.fromJson(Map<String, dynamic> json) {
    return Camion(
      id: json['id'] as int,
      placas: json['placas'] as String,
      numeroEconomico: json['numero_economico'] as String?,
      nfcTagUid: json['nfc_tag_uid'] as String,
      capacidadM3: json['capacidad_m3'] as String,
      tipoCamion: json['tipo_camion'] as String?,
      marca: json['marca'] as String?,
      modelo: json['modelo'] as String?,
      anio: json['anio'] as int?,
      activo: json['activo'] as bool,
      creadoEn: json['creado_en'] as String,
      actualizadoEn: json['actualizado_en'] as String,
    );
  }
}
