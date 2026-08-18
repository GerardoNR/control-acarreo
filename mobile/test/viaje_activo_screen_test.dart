import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/camion.dart';
import 'package:mobile/models/viaje.dart';
import 'package:mobile/screens/viajes/viaje_activo_screen.dart';
import 'package:mobile/services/catalogos_service.dart';
import 'package:mobile/services/viajes_service.dart';

void main() {
  testWidgets('cierra el formulario de llegada sin usar controllers disposed', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ViajeActivoScreen(
          catalogosService: _CatalogosServiceFake(),
          viajesService: _ViajesServiceFake(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Camión'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('ECO-001 · 44ES8M').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('CONSULTAR VIAJE'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('REGISTRAR LLEGADA'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('REGISTRAR LLEGADA'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('¿Confirmar llegada?'), findsOneWidget);
    await tester.tap(find.text('CANCELAR').last);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

const _fecha = '2026-08-17T18:00:00.000Z';
const _camion = Camion(
  id: 1,
  placas: '44ES8M',
  numeroEconomico: 'ECO-001',
  nfcTagUid: 'UID-1',
  capacidadM3: '16.200',
  tipoCamion: null,
  marca: null,
  modelo: null,
  anio: null,
  activo: true,
  creadoEn: _fecha,
  actualizadoEn: _fecha,
);

Viaje _viajeActivo() => Viaje.fromJson({
  'id': '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
  'id_legacy': null,
  'folio': 'VIA-20260817-000042',
  'proyecto': {'id': 1, 'nombre': 'Proyecto Anáhuac'},
  'material': {'id': 1, 'nombre': 'Terraplén', 'unidad_medida': 'm3'},
  'camion': {
    'id': 1,
    'placas': '44ES8M',
    'numero_economico': 'ECO-001',
    'nfc_tag_uid': 'UID-1',
  },
  'chofer': {
    'id': 1,
    'nombre': 'Juan',
    'apellido_paterno': 'Pérez',
    'apellido_materno': null,
  },
  'ubicacion_origen': {'id': 1, 'nombre': 'Banco Uno', 'tipo': 'banco'},
  'ubicacion_destino': {'id': 2, 'nombre': 'Frente Uno', 'tipo': 'frente'},
  'checador_salida': {'id': 1, 'nombre': 'Checador Uno'},
  'checador_llegada': null,
  'administrador_cancelacion': null,
  'cantidad_salida': '14.500',
  'cantidad_llegada': null,
  'unidad_medida': 'm3',
  'fecha_hora_salida': _fecha,
  'fecha_hora_llegada': null,
  'fecha_hora_cancelacion': null,
  'estado': 'en_transito',
  'observaciones_salida': null,
  'observaciones_llegada': null,
  'motivo_cancelacion': null,
  'creado_en': _fecha,
  'actualizado_en': _fecha,
});

class _CatalogosServiceFake extends CatalogosService {
  @override
  Future<List<Camion>> obtenerCamiones() async => [_camion];
}

class _ViajesServiceFake extends ViajesService {
  @override
  Future<Viaje?> obtenerViajeActivoPorCamion(int camionId) async {
    return _viajeActivo();
  }
}
