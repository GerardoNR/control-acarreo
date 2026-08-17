import '../models/camion.dart';
import '../models/chofer.dart';
import '../models/material.dart';
import '../models/proyecto.dart';
import '../models/ubicacion.dart';
import 'api_service.dart';

class CatalogosService {
  CatalogosService({ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  Future<List<Proyecto>> obtenerProyectos() {
    return _obtenerLista('/proyectos', Proyecto.fromJson);
  }

  Future<List<Material>> obtenerMateriales() {
    return _obtenerLista('/materiales', Material.fromJson);
  }

  Future<List<Camion>> obtenerCamiones() {
    return _obtenerLista('/camiones', Camion.fromJson);
  }

  Future<List<Chofer>> obtenerChoferes() {
    return _obtenerLista('/choferes', Chofer.fromJson);
  }

  Future<List<Ubicacion>> obtenerUbicaciones() {
    return _obtenerLista('/ubicaciones', Ubicacion.fromJson);
  }

  Future<List<T>> _obtenerLista<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await _apiService.get<List<dynamic>>(
      path,
      autenticado: true,
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('El catálogo no contiene una lista JSON.');
    }

    return data
        .map((item) => fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }
}
