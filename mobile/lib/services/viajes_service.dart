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
}
