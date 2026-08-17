import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../models/camion.dart';
import '../models/chofer.dart';
import '../models/material.dart' as catalogo;
import '../models/proyecto.dart';
import '../models/ubicacion.dart';
import '../services/auth_service.dart';
import '../services/catalogos_service.dart';

void main() {
  runApp(const CatalogosSmokeTestApp());
}

class CatalogosSmokeTestApp extends StatelessWidget {
  const CatalogosSmokeTestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Prueba de catálogos',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: const CatalogosSmokeTestScreen(),
    );
  }
}

class CatalogosSmokeTestScreen extends StatefulWidget {
  const CatalogosSmokeTestScreen({super.key});

  @override
  State<CatalogosSmokeTestScreen> createState() =>
      _CatalogosSmokeTestScreenState();
}

class _CatalogosSmokeTestScreenState extends State<CatalogosSmokeTestScreen> {
  final _authService = AuthService();
  final _catalogosService = CatalogosService();

  bool _cargando = false;
  final List<String> _resultados = [];

  Future<void> _probarCatalogos() async {
    if (_cargando) return;
    setState(() {
      _cargando = true;
      _resultados.clear();
    });

    try {
      if (!await _authService.haySesion()) {
        _agregar('No existe un JWT almacenado. Inicia sesión en la app.');
        return;
      }

      await _probar<Proyecto>(
        'Proyectos',
        _catalogosService.obtenerProyectos,
        (item) => '${item.id}: ${item.nombre}',
      );
      await _probar<catalogo.Material>(
        'Materiales',
        _catalogosService.obtenerMateriales,
        (item) => '${item.id}: ${item.nombre} (${item.unidadMedida})',
      );
      await _probar<Camion>(
        'Camiones',
        _catalogosService.obtenerCamiones,
        (item) => '${item.id}: ${item.placas} — ${item.capacidadM3} m³',
      );
      await _probar<Chofer>(
        'Choferes',
        _catalogosService.obtenerChoferes,
        (item) => '${item.id}: ${item.nombreCompleto}',
      );
      await _probar<Ubicacion>(
        'Ubicaciones',
        _catalogosService.obtenerUbicaciones,
        (item) =>
            '${item.id}: ${item.nombre} (${item.tipo}) — '
            '${item.proyecto.nombre}',
      );
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _probar<T>(
    String nombre,
    Future<List<T>> Function() cargar,
    String Function(T) describir,
  ) async {
    try {
      final elementos = await cargar();
      final muestra = elementos.take(3).map(describir).join('\n');
      _agregar(
        '$nombre: OK — ${elementos.length} registros'
        '${muestra.isEmpty ? '' : '\n$muestra'}',
      );
    } catch (error) {
      _agregar('$nombre: ERROR — ${_formatearError(error)}');
    }
  }

  String _formatearError(Object error) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      if (codigo != null) return 'HTTP $codigo';
      return 'no fue posible conectar con el backend';
    }
    if (error is FormatException || error is TypeError) {
      return 'respuesta JSON inesperada (${error.runtimeType})';
    }
    return error.runtimeType.toString();
  }

  void _agregar(String resultado) {
    if (!mounted) return;
    setState(() => _resultados.add(resultado));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Catálogos smoke test')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            FilledButton(
              onPressed: _cargando ? null : _probarCatalogos,
              child: const Text('PROBAR CINCO CATÁLOGOS'),
            ),
            const SizedBox(height: 16),
            if (_cargando) const LinearProgressIndicator(),
            const SizedBox(height: 16),
            if (_resultados.isEmpty && !_cargando)
              const Text('Listo para usar el JWT almacenado.'),
            for (final resultado in _resultados) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SelectableText(resultado),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }
}
