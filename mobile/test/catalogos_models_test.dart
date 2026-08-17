import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/camion.dart';
import 'package:mobile/models/chofer.dart';
import 'package:mobile/models/material.dart';
import 'package:mobile/models/proyecto.dart';
import 'package:mobile/models/ubicacion.dart';

void main() {
  const creadoEn = '2026-08-17T10:00:00.000Z';
  const actualizadoEn = '2026-08-17T11:00:00.000Z';

  final proyectoJson = <String, dynamic>{
    'id': 1,
    'nombre': 'Proyecto Norte',
    'clave': 'PN-01',
    'desarrolladora': null,
    'descripcion': 'Frente norte',
    'nota_ruta': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };

  test('parsea Proyecto y Material desde el contrato del backend', () {
    final proyecto = Proyecto.fromJson(proyectoJson);
    final material = Material.fromJson({
      'id': 2,
      'nombre': 'Tepetate',
      'unidad_medida': 'm3',
      'descripcion': null,
      'activo': true,
      'creado_en': creadoEn,
      'actualizado_en': actualizadoEn,
    });

    expect(proyecto.clave, 'PN-01');
    expect(proyecto.desarrolladora, isNull);
    expect(material.nombre, 'Tepetate');
    expect(material.unidadMedida, 'm3');
  });

  test('parsea Camion con decimal string y campos opcionales', () {
    final camion = Camion.fromJson({
      'id': 3,
      'placas': 'ABC-123',
      'numero_economico': null,
      'nfc_tag_uid': 'UID-PRUEBA',
      'capacidad_m3': '14.50',
      'tipo_camion': 'Volteo',
      'marca': null,
      'modelo': null,
      'anio': 2024,
      'activo': true,
      'creado_en': creadoEn,
      'actualizado_en': actualizadoEn,
    });

    expect(camion.placas, 'ABC-123');
    expect(camion.capacidadM3, '14.50');
    expect(camion.numeroEconomico, isNull);
  });

  test('parsea Chofer y Ubicacion con su proyecto relacionado', () {
    final chofer = Chofer.fromJson({
      'id': 4,
      'nombre': 'Ana',
      'apellido_paterno': 'Pérez',
      'apellido_materno': null,
      'telefono': null,
      'licencia': 'LIC-1',
      'vigencia_licencia': '2027-01-01',
      'activo': true,
      'creado_en': creadoEn,
      'actualizado_en': actualizadoEn,
    });
    final ubicacion = Ubicacion.fromJson({
      'id': 5,
      'proyecto': proyectoJson,
      'nombre': 'Banco principal',
      'tipo': 'banco',
      'descripcion': null,
      'referencia': 'Acceso norte',
      'activo': true,
      'creado_en': creadoEn,
      'actualizado_en': actualizadoEn,
    });

    expect(chofer.nombreCompleto, 'Ana Pérez');
    expect(ubicacion.tipo, 'banco');
    expect(ubicacion.proyecto.nombre, 'Proyecto Norte');
  });
}
