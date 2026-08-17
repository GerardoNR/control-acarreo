import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/registrar_salida_request.dart';
import 'package:mobile/models/viaje.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/services/viajes_service.dart';

void main() {
  const creadoEn = '2026-08-17T18:00:00.000Z';
  const actualizadoEn = '2026-08-17T18:00:00.000Z';

  final proyecto = <String, dynamic>{
    'id': 1,
    'nombre': 'Proyecto Anáhuac',
    'clave': 'PA-01',
    'desarrolladora': null,
    'descripcion': null,
    'nota_ruta': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };
  final material = <String, dynamic>{
    'id': 2,
    'nombre': 'Terraplén',
    'unidad_medida': 'm3',
    'descripcion': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };
  final camion = <String, dynamic>{
    'id': 3,
    'placas': '44ES8M',
    'numero_economico': 'ECO-001',
    'nfc_tag_uid': 'UID-PRUEBA',
    'capacidad_m3': '20.00',
    'tipo_camion': 'Volteo',
    'marca': null,
    'modelo': null,
    'anio': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };
  final chofer = <String, dynamic>{
    'id': 4,
    'nombre': 'Juan',
    'apellido_paterno': 'Pérez',
    'apellido_materno': 'García',
    'telefono': null,
    'licencia': null,
    'vigencia_licencia': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };

  Map<String, dynamic> ubicacion(int id, String nombre, String tipo) => {
    'id': id,
    'proyecto': proyecto,
    'nombre': nombre,
    'tipo': tipo,
    'descripcion': null,
    'referencia': null,
    'activo': true,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };

  Map<String, dynamic> viajeJson() => {
    'id': '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
    'id_legacy': null,
    'folio': 'VIA-20260817-000042',
    'proyecto': proyecto,
    'material': material,
    'camion': camion,
    'chofer': chofer,
    'ubicacion_origen': ubicacion(5, 'Banco Huizachito', 'banco'),
    'ubicacion_destino': ubicacion(6, 'Frente KM 350+800', 'frente'),
    'checador_salida': {'id': 7, 'nombre': 'Checador Uno'},
    'checador_llegada': null,
    'administrador_cancelacion': null,
    'checador_origen': null,
    'checador_destino': null,
    'cantidad_salida': '14.5',
    'cantidad_llegada': null,
    'unidad_medida': 'm3',
    'fecha_hora_salida': creadoEn,
    'fecha_hora_llegada': null,
    'fecha_hora_cancelacion': null,
    'estado': 'en_transito',
    'observaciones_salida': 'Carga revisada',
    'observaciones_llegada': null,
    'motivo_cancelacion': null,
    'cantidad_m3': null,
    'folio_banco': null,
    'fecha_hora_origen': null,
    'fecha_hora_destino': null,
    'nota': null,
    'impreso': false,
    'fecha_impresion': null,
    'dispositivo_origen_id': null,
    'dispositivo_destino_id': null,
    'sincronizado': false,
    'creado_en': creadoEn,
    'actualizado_en': actualizadoEn,
  };

  const request = RegistrarSalidaRequest(
    proyectoId: 1,
    materialId: 2,
    camionId: 3,
    choferId: 4,
    ubicacionOrigenId: 5,
    ubicacionDestinoId: 6,
    cantidadSalida: 14.5,
    observacionesSalida: 'Carga revisada',
  );

  test('parsea la respuesta real de registrar salida', () {
    final viaje = Viaje.fromJson(viajeJson());

    expect(viaje.id, '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85');
    expect(viaje.idLegacy, isNull);
    expect(viaje.folio, 'VIA-20260817-000042');
    expect(viaje.estado, 'en_transito');
    expect(viaje.proyecto.nombre, 'Proyecto Anáhuac');
    expect(viaje.material.nombre, 'Terraplén');
    expect(viaje.camion.placas, '44ES8M');
    expect(viaje.chofer.nombreCompleto, 'Juan Pérez García');
    expect(viaje.ubicacionOrigen.tipo, 'banco');
    expect(viaje.ubicacionDestino.tipo, 'frente');
    expect(viaje.cantidadSalida, '14.5');
    expect(viaje.cantidadLlegada, isNull);
    expect(viaje.fechaHoraLlegada, isNull);
    expect(viaje.observacionesSalida, 'Carga revisada');
  });

  test('serializa exclusivamente los campos permitidos para la salida', () {
    expect(request.toJson(), {
      'proyecto_id': 1,
      'material_id': 2,
      'camion_id': 3,
      'chofer_id': 4,
      'ubicacion_origen_id': 5,
      'ubicacion_destino_id': 6,
      'cantidad_salida': 14.5,
      'observaciones_salida': 'Carga revisada',
    });
    expect(request.toJson(), isNot(contains('estado')));
    expect(request.toJson(), isNot(contains('folio')));
  });

  test('omite observaciones cuando no se proporcionan', () {
    final json = RegistrarSalidaRequest(
      proyectoId: request.proyectoId,
      materialId: request.materialId,
      camionId: request.camionId,
      choferId: request.choferId,
      ubicacionOrigenId: request.ubicacionOrigenId,
      ubicacionDestinoId: request.ubicacionDestinoId,
      cantidadSalida: request.cantidadSalida,
    ).toJson();

    expect(json, isNot(contains('observaciones_salida')));
  });

  test('ViajesService usa POST autenticado y devuelve Viaje', () async {
    final apiService = _FakeApiService(viajeJson());
    final service = ViajesService(apiService: apiService);

    final viaje = await service.registrarSalida(request);

    expect(apiService.path, '/viajes/salida');
    expect(apiService.autenticado, isTrue);
    expect(apiService.data, request.toJson());
    expect(viaje.folio, 'VIA-20260817-000042');
  });

  test('ViajesService propaga un conflicto HTTP 409', () async {
    final conflict = DioException(
      requestOptions: RequestOptions(path: '/viajes/salida'),
      response: Response<void>(
        requestOptions: RequestOptions(path: '/viajes/salida'),
        statusCode: 409,
      ),
      type: DioExceptionType.badResponse,
    );
    final service = ViajesService(apiService: _FakeApiService.error(conflict));

    await expectLater(
      service.registrarSalida(request),
      throwsA(same(conflict)),
    );
  });
}

class _FakeApiService extends ApiService {
  _FakeApiService(this.responseData) : error = null;

  _FakeApiService.error(this.error) : responseData = null;

  final Map<String, dynamic>? responseData;
  final DioException? error;
  String? path;
  Object? data;
  bool? autenticado;

  @override
  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    bool autenticado = false,
  }) async {
    this.path = path;
    this.data = data;
    this.autenticado = autenticado;
    if (error != null) throw error!;
    return Response<T>(
      data: responseData as T,
      requestOptions: RequestOptions(path: path),
      statusCode: 201,
    );
  }
}
