import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../models/camion.dart';
import '../../models/pagina_viajes.dart';
import '../../models/proyecto.dart';
import '../../models/viaje.dart';
import '../../services/catalogos_service.dart';
import '../../services/viajes_service.dart';
import 'detalle_viaje_screen.dart';

class HistorialScreen extends StatefulWidget {
  const HistorialScreen({super.key, this.catalogosService, this.viajesService});

  final CatalogosService? catalogosService;
  final ViajesService? viajesService;

  @override
  State<HistorialScreen> createState() => _HistorialScreenState();
}

class _HistorialScreenState extends State<HistorialScreen> {
  static const _limite = 20;
  static const _estados = <String, String>{
    'en_transito': 'En tránsito',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
  };

  final _folioController = TextEditingController();
  late final CatalogosService _catalogosService;
  late final ViajesService _viajesService;

  List<Camion> _camiones = [];
  List<Proyecto> _proyectos = [];
  Camion? _camion;
  Proyecto? _proyecto;
  String? _estado;

  String? _folioAplicado;
  int? _camionIdAplicado;
  int? _proyectoIdAplicado;
  String? _estadoAplicado;

  PaginaViajes? _resultado;
  bool _cargandoInicial = true;
  bool _consultando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogosService = widget.catalogosService ?? CatalogosService();
    _viajesService = widget.viajesService ?? ViajesService();
    _cargarInicial();
  }

  @override
  void dispose() {
    _folioController.dispose();
    super.dispose();
  }

  Future<void> _cargarInicial() async {
    setState(() {
      _cargandoInicial = true;
      _error = null;
    });
    try {
      final resultados = await Future.wait<Object>([
        _catalogosService.obtenerCamiones(),
        _catalogosService.obtenerProyectos(),
        _viajesService.obtenerHistorial(limite: _limite),
      ]);
      if (!mounted) return;
      setState(() {
        _camiones = (resultados[0] as List<Camion>)
            .where((item) => item.activo)
            .toList(growable: false);
        _proyectos = (resultados[1] as List<Proyecto>)
            .where((item) => item.activo)
            .toList(growable: false);
        _resultado = resultados[2] as PaginaViajes;
        _cargandoInicial = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _cargandoInicial = false;
        _error = _mensajeError(error);
      });
    }
  }

  Future<void> _consultar(int pagina) async {
    if (_consultando) return;
    setState(() {
      _consultando = true;
      _error = null;
    });
    try {
      final resultado = await _viajesService.obtenerHistorial(
        pagina: pagina,
        limite: _limite,
        folio: _folioAplicado,
        estado: _estadoAplicado,
        camionId: _camionIdAplicado,
        proyectoId: _proyectoIdAplicado,
      );
      if (!mounted) return;
      setState(() => _resultado = resultado);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _mensajeError(error));
    } finally {
      if (mounted) setState(() => _consultando = false);
    }
  }

  void _aplicarFiltros() {
    final folio = _folioController.text.trim();
    _folioAplicado = folio.isEmpty ? null : folio;
    _estadoAplicado = _estado;
    _camionIdAplicado = _camion?.id;
    _proyectoIdAplicado = _proyecto?.id;
    _consultar(1);
  }

  void _limpiarFiltros() {
    _folioController.clear();
    setState(() {
      _estado = null;
      _camion = null;
      _proyecto = null;
    });
    _folioAplicado = null;
    _estadoAplicado = null;
    _camionIdAplicado = null;
    _proyectoIdAplicado = null;
    _consultar(1);
  }

  String _mensajeError(Object error) {
    if (error is DioException) {
      switch (error.response?.statusCode) {
        case 400:
          return 'Los filtros seleccionados no son válidos.';
        case 401:
          return 'La sesión no es válida o expiró.';
        case 403:
          return 'No tienes permiso para consultar viajes.';
      }
      if (error.response == null) return 'No se pudo conectar con el servidor.';
    }
    return 'No se pudo cargar el historial de viajes.';
  }

  String _nombreCamion(Camion camion) {
    final numero = camion.numeroEconomico?.trim();
    return numero == null || numero.isEmpty
        ? camion.placas
        : '$numero · ${camion.placas}';
  }

  String _fecha(String valor) {
    final fecha = DateTime.tryParse(valor)?.toLocal();
    if (fecha == null) return valor;
    String dos(int numero) => numero.toString().padLeft(2, '0');
    return '${dos(fecha.day)}/${dos(fecha.month)}/${fecha.year} '
        '${dos(fecha.hour)}:${dos(fecha.minute)}';
  }

  void _abrirDetalle(Viaje viaje) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetalleViajeScreen(viaje: viaje)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historial de viajes')),
      body: SafeArea(child: _contenido()),
    );
  }

  Widget _contenido() {
    if (_cargandoInicial) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Cargando historial...'),
          ],
        ),
      );
    }

    if (_resultado == null && _error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _cargarInicial,
                icon: const Icon(Icons.refresh),
                label: const Text('REINTENTAR'),
              ),
            ],
          ),
        ),
      );
    }

    final resultado = _resultado!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _folioController,
          enabled: !_consultando,
          maxLength: 19,
          decoration: const InputDecoration(
            labelText: 'Folio',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String?>(
          initialValue: _estado,
          decoration: const InputDecoration(
            labelText: 'Estado',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('Todos')),
            for (final entry in _estados.entries)
              DropdownMenuItem(value: entry.key, child: Text(entry.value)),
          ],
          onChanged: _consultando
              ? null
              : (valor) => setState(() => _estado = valor),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<Camion?>(
          initialValue: _camion,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Camión',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(
              value: null,
              child: Text('Todos los camiones'),
            ),
            for (final camion in _camiones)
              DropdownMenuItem(
                value: camion,
                child: Text(
                  _nombreCamion(camion),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
          onChanged: _consultando
              ? null
              : (valor) => setState(() => _camion = valor),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<Proyecto?>(
          initialValue: _proyecto,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Proyecto',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(
              value: null,
              child: Text('Todos los proyectos'),
            ),
            for (final proyecto in _proyectos)
              DropdownMenuItem(
                value: proyecto,
                child: Text(proyecto.nombre, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: _consultando
              ? null
              : (valor) => setState(() => _proyecto = valor),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _consultando ? null : _limpiarFiltros,
                child: const Text('LIMPIAR'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: _consultando ? null : _aplicarFiltros,
                child: const Text('APLICAR FILTROS'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_consultando) const LinearProgressIndicator(),
        if (_error != null)
          Card(
            color: Theme.of(context).colorScheme.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(_error!, textAlign: TextAlign.center),
                  TextButton(
                    onPressed: _consultando
                        ? null
                        : () => _consultar(resultado.pagina),
                    child: const Text('REINTENTAR'),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 8),
        Text('${resultado.total} viajes encontrados'),
        const SizedBox(height: 8),
        if (resultado.viajes.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text(
                'No se encontraron viajes con los filtros seleccionados.',
                textAlign: TextAlign.center,
              ),
            ),
          )
        else
          for (final viaje in resultado.viajes) _tarjeta(viaje),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: !_consultando && resultado.pagina > 1
                  ? () => _consultar(resultado.pagina - 1)
                  : null,
              child: const Text('ANTERIOR'),
            ),
            Text(
              resultado.totalPaginas == 0
                  ? 'Sin páginas'
                  : 'Página ${resultado.pagina} de ${resultado.totalPaginas}',
            ),
            TextButton(
              onPressed:
                  !_consultando && resultado.pagina < resultado.totalPaginas
                  ? () => _consultar(resultado.pagina + 1)
                  : null,
              child: const Text('SIGUIENTE'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _tarjeta(Viaje viaje) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _abrirDetalle(viaje),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      viaje.folio,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(_estados[viaje.estado] ?? viaje.estado),
                ],
              ),
              Text(_fecha(viaje.fechaHoraSalida)),
              const Divider(height: 20),
              Text('${_nombreCamion(viaje.camion)} · ${viaje.proyecto.nombre}'),
              Text(viaje.material.nombre),
              Text(
                '${viaje.ubicacionOrigen.nombre} → ${viaje.ubicacionDestino.nombre}',
              ),
              Text('${viaje.cantidadSalida} ${viaje.unidadMedida}'),
            ],
          ),
        ),
      ),
    );
  }
}
