import '../models/registrar_llegada_request.dart';
import '../models/registrar_salida_request.dart';
import '../models/viaje.dart';
import 'api_service.dart';

class ViajesService {
  ViajesService({ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  Future<Viaje> registrarSalida(RegistrarSalidaRequest request) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/viajes/salida',
      data: request.toJson(),
      autenticado: true,
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('La respuesta no contiene un viaje.');
    }
    return Viaje.fromJson(data);
  }

  Future<Viaje?> obtenerViajeActivoPorCamion(int camionId) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/viajes',
      queryParameters: {
        'camion_id': camionId,
        'estado': 'en_transito',
        'page': 1,
        'limit': 1,
      },
      autenticado: true,
    );
    final data = response.data?['data'];
    if (data is! List<dynamic>) {
      throw const FormatException('La respuesta de viajes no es válida.');
    }

    for (final item in data) {
      final viaje = Viaje.fromJson(item as Map<String, dynamic>);
      if (viaje.camion.id == camionId && viaje.estado == 'en_transito') {
        return viaje;
      }
    }
    return null;
  }

  Future<Viaje> registrarLlegada(
    String viajeId,
    RegistrarLlegadaRequest request,
  ) async {
    final response = await _apiService.patch<Map<String, dynamic>>(
      '/viajes/$viajeId/llegada',
      data: request.toJson(),
      autenticado: true,
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('La respuesta no contiene un viaje.');
    }
    return Viaje.fromJson(data);
  }
}
