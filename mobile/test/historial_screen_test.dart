import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/camion.dart';
import 'package:mobile/models/pagina_viajes.dart';
import 'package:mobile/models/proyecto.dart';
import 'package:mobile/models/viaje.dart';
import 'package:mobile/screens/viajes/historial_screen.dart';
import 'package:mobile/services/catalogos_service.dart';
import 'package:mobile/services/viajes_service.dart';

void main() {
  testWidgets('muestra resultados, aplica folio y abre el detalle', (
    tester,
  ) async {
    final viajesService = _ViajesServiceFake(viajes: [_viaje()]);
    await tester.pumpWidget(
      MaterialApp(
        home: HistorialScreen(
          catalogosService: _CatalogosServiceFake(),
          viajesService: viajesService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1 viaje'), findsOneWidget);
    expect(find.text('VIA-20260817-000042'), findsOneWidget);

    await tester.tap(find.text('Completados'));
    await tester.pumpAndSettle();
    expect(viajesService.estado, 'completado');

    await tester.tap(find.text('Buscar y filtrar'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '  000042  ');
    await tester.ensureVisible(find.text('APLICAR'));
    await tester.tap(find.text('APLICAR'));
    await tester.pumpAndSettle();
    expect(viajesService.folio, '000042');
    expect(viajesService.pagina, 1);

    await tester.ensureVisible(find.text('VIA-20260817-000042'));
    await tester.tap(find.text('VIA-20260817-000042'));
    await tester.pumpAndSettle();
    expect(find.text('Detalle del viaje'), findsOneWidget);
    expect(find.text('No registrado'), findsWidgets);
  });

  testWidgets('muestra estado vacío y pagina conservando filtros', (
    tester,
  ) async {
    final viajesService = _ViajesServiceFake(viajes: [], totalPaginas: 2);
    await tester.pumpWidget(
      MaterialApp(
        home: HistorialScreen(
          catalogosService: _CatalogosServiceFake(),
          viajesService: viajesService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('No hay viajes'), findsOneWidget);
    final siguiente = tester.widget<TextButton>(
      find.widgetWithText(TextButton, 'SIGUIENTE'),
    );
    siguiente.onPressed!();
    await tester.pumpAndSettle();
    expect(viajesService.pagina, 2);
  });
}

const _fecha = '2026-08-17T18:00:00.000Z';
const _proyecto = Proyecto(
  id: 1,
  nombre: 'Proyecto Anáhuac',
  clave: null,
  desarrolladora: null,
  descripcion: null,
  notaRuta: null,
  activo: true,
  creadoEn: _fecha,
  actualizadoEn: _fecha,
);
const _camion = Camion(
  id: 3,
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

Viaje _viaje() => Viaje.fromJson({
  'id': '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
  'id_legacy': null,
  'folio': 'VIA-20260817-000042',
  'proyecto': {'id': 1, 'nombre': 'Proyecto Anáhuac'},
  'material': {'id': 2, 'nombre': 'Terraplén', 'unidad_medida': 'm3'},
  'camion': {
    'id': 3,
    'placas': '44ES8M',
    'numero_economico': 'ECO-001',
    'nfc_tag_uid': 'UID-1',
  },
  'chofer': {
    'id': 4,
    'nombre': 'Juan',
    'apellido_paterno': 'Pérez',
    'apellido_materno': null,
  },
  'ubicacion_origen': {'id': 5, 'nombre': 'Banco Uno', 'tipo': 'banco'},
  'ubicacion_destino': {'id': 6, 'nombre': 'Frente Uno', 'tipo': 'frente'},
  'checador_salida': {'id': 7, 'nombre': 'Checador Uno'},
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

  @override
  Future<List<Proyecto>> obtenerProyectos() async => [_proyecto];
}

class _ViajesServiceFake extends ViajesService {
  _ViajesServiceFake({required this.viajes, this.totalPaginas = 1});

  final List<Viaje> viajes;
  final int totalPaginas;
  int pagina = 1;
  String? folio;
  String? estado;

  @override
  Future<PaginaViajes> obtenerHistorial({
    int pagina = 1,
    int limite = 20,
    String? folio,
    String? estado,
    int? camionId,
    int? proyectoId,
  }) async {
    this.pagina = pagina;
    this.folio = folio;
    this.estado = estado;
    return PaginaViajes(
      viajes: viajes,
      pagina: pagina,
      limite: limite,
      total: viajes.length,
      totalPaginas: totalPaginas,
    );
  }
}
