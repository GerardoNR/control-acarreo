import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../models/camion.dart';
import '../../models/chofer.dart';
import '../../models/material.dart' as catalogo;
import '../../models/proyecto.dart';
import '../../models/registrar_salida_request.dart';
import '../../models/ubicacion.dart';
import '../../models/viaje.dart';
import '../../services/catalogos_service.dart';
import '../../services/viajes_service.dart';

double? normalizarCantidadSalida(String texto) {
  final valor = texto.trim();
  if (!RegExp(r'^\d+(?:[.,]\d{1,3})?$').hasMatch(valor)) return null;

  final cantidad = double.tryParse(valor.replaceAll(',', '.'));
  if (cantidad == null || !cantidad.isFinite || cantidad <= 0) return null;
  return cantidad;
}

class RegistrarSalidaScreen extends StatefulWidget {
  const RegistrarSalidaScreen({
    super.key,
    this.catalogosService,
    this.viajesService,
  });

  final CatalogosService? catalogosService;
  final ViajesService? viajesService;

  @override
  State<RegistrarSalidaScreen> createState() => _RegistrarSalidaScreenState();
}

class _RegistrarSalidaScreenState extends State<RegistrarSalidaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cantidadController = TextEditingController();
  final _observacionesController = TextEditingController();

  late final CatalogosService _catalogosService;
  late final ViajesService _viajesService;

  List<Proyecto> _proyectos = [];
  List<catalogo.Material> _materiales = [];
  List<Camion> _camiones = [];
  List<Chofer> _choferes = [];
  List<Ubicacion> _ubicaciones = [];

  Proyecto? _proyecto;
  catalogo.Material? _material;
  Camion? _camion;
  Chofer? _chofer;
  Ubicacion? _origen;
  Ubicacion? _destino;

  bool _cargando = true;
  bool _enviando = false;
  String? _errorCarga;

  @override
  void initState() {
    super.initState();
    _catalogosService = widget.catalogosService ?? CatalogosService();
    _viajesService = widget.viajesService ?? ViajesService();
    _cargarCatalogos();
  }

  @override
  void dispose() {
    _cantidadController.dispose();
    _observacionesController.dispose();
    super.dispose();
  }

  List<Ubicacion> get _origenesDisponibles {
    final proyectoId = _proyecto?.id;
    if (proyectoId == null) return [];
    return _ubicaciones
        .where((item) => item.proyecto.id == proyectoId && item.tipo == 'banco')
        .toList(growable: false);
  }

  List<Ubicacion> get _destinosDisponibles {
    final proyectoId = _proyecto?.id;
    if (proyectoId == null) return [];
    return _ubicaciones
        .where(
          (item) => item.proyecto.id == proyectoId && item.tipo == 'frente',
        )
        .toList(growable: false);
  }

  Future<void> _cargarCatalogos() async {
    if (mounted) {
      setState(() {
        _cargando = true;
        _errorCarga = null;
      });
    }

    try {
      final resultados = await Future.wait<Object>([
        _catalogosService.obtenerProyectos(),
        _catalogosService.obtenerMateriales(),
        _catalogosService.obtenerCamiones(),
        _catalogosService.obtenerChoferes(),
        _catalogosService.obtenerUbicaciones(),
      ]);
      if (!mounted) return;
      setState(() {
        _proyectos = (resultados[0] as List<Proyecto>)
            .where((item) => item.activo)
            .toList(growable: false);
        _materiales = (resultados[1] as List<catalogo.Material>)
            .where((item) => item.activo)
            .toList(growable: false);
        _camiones = (resultados[2] as List<Camion>)
            .where((item) => item.activo)
            .toList(growable: false);
        _choferes = (resultados[3] as List<Chofer>)
            .where((item) => item.activo)
            .toList(growable: false);
        _ubicaciones = (resultados[4] as List<Ubicacion>)
            .where((item) => item.activo)
            .toList(growable: false);
        _cargando = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _cargando = false;
        _errorCarga = _mensajeErrorCarga(error);
      });
    }
  }

  void _cambiarProyecto(Proyecto? proyecto) {
    setState(() {
      _proyecto = proyecto;
      _origen = null;
      _destino = null;
    });
  }

  Future<void> _confirmarYRegistrar() async {
    if (_enviando || !(_formKey.currentState?.validate() ?? false)) return;

    final proyecto = _proyecto!;
    final material = _material!;
    final camion = _camion!;
    final chofer = _chofer!;
    final origen = _origen!;
    final destino = _destino!;
    final cantidad = normalizarCantidadSalida(_cantidadController.text)!;

    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Confirmar salida'),
        content: SingleChildScrollView(
          child: Text(
            'Proyecto: ${proyecto.nombre}\n'
            'Camión: ${_nombreCamion(camion)}\n'
            'Origen: ${origen.nombre}\n'
            'Destino: ${destino.nombre}\n'
            'Material: ${material.nombre}\n'
            'Cantidad: ${_cantidadController.text.trim()} '
            '${material.unidadMedida}\n'
            'Chofer: ${chofer.nombreCompleto}',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('CANCELAR'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('CONFIRMAR SALIDA'),
          ),
        ],
      ),
    );
    if (confirmado != true || !mounted) return;

    final observaciones = _observacionesController.text.trim();
    final request = RegistrarSalidaRequest(
      proyectoId: proyecto.id,
      materialId: material.id,
      camionId: camion.id,
      choferId: chofer.id,
      ubicacionOrigenId: origen.id,
      ubicacionDestinoId: destino.id,
      cantidadSalida: cantidad,
      observacionesSalida: observaciones.isEmpty ? null : observaciones,
    );

    setState(() => _enviando = true);
    try {
      final viaje = await _viajesService.registrarSalida(request);
      if (!mounted) return;
      await _mostrarResultado(viaje);
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      _mostrarError(_mensajeRegistro(error));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _mostrarResultado(Viaje viaje) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Text('SALIDA REGISTRADA'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Folio: ${viaje.folio}',
                style: Theme.of(dialogContext).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Text('Camión: ${_nombreCamion(viaje.camion)}'),
              Text('Material: ${viaje.material.nombre}'),
              Text('Cantidad: ${viaje.cantidadSalida} ${viaje.unidadMedida}'),
              Text('Origen: ${viaje.ubicacionOrigen.nombre}'),
              Text('Destino: ${viaje.ubicacionDestino.nombre}'),
              Text('Estado: ${viaje.estado}'),
            ],
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('ACEPTAR'),
          ),
        ],
      ),
    );
  }

  String _mensajeErrorCarga(Object error) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      if (codigo == 401) return 'La sesión no es válida o expiró.';
      if (codigo == 403) return 'No tienes permiso para cargar catálogos.';
      if (error.response == null) {
        return 'No se pudo conectar con el servidor.';
      }
    }
    return 'No se pudieron cargar los catálogos.';
  }

  String _mensajeRegistro(Object error) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      switch (codigo) {
        case 400:
          return 'Los datos de la salida no son válidos.';
        case 401:
          return 'La sesión no es válida o expiró.';
        case 403:
          return 'No tienes permiso para registrar salidas.';
        case 409:
          return 'Este camión ya tiene un viaje activo. No se puede registrar '
              'otra salida hasta finalizar el viaje actual.';
      }
      if (error.response == null) {
        return 'No se pudo conectar con el servidor.';
      }
    }
    return 'No se pudo registrar la salida.';
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(mensaje)));
  }

  String _nombreCamion(Camion camion) {
    final numero = camion.numeroEconomico?.trim();
    return numero == null || numero.isEmpty
        ? camion.placas
        : '$numero · ${camion.placas}';
  }

  String? _requerido<T>(T? valor, String nombre) {
    return valor == null ? 'Selecciona $nombre.' : null;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_enviando,
      child: Scaffold(
        appBar: AppBar(title: const Text('Registrar salida')),
        body: SafeArea(child: _construirContenido()),
      ),
    );
  }

  Widget _construirContenido() {
    if (_cargando) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Cargando catálogos...'),
          ],
        ),
      );
    }

    if (_errorCarga != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_errorCarga!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _cargarCatalogos,
                icon: const Icon(Icons.refresh),
                label: const Text('REINTENTAR'),
              ),
            ],
          ),
        ),
      );
    }

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<Proyecto>(
            initialValue: _proyecto,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Proyecto',
              border: OutlineInputBorder(),
            ),
            items: _proyectos
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(item.nombre, overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: _enviando ? null : _cambiarProyecto,
            validator: (valor) => _requerido(valor, 'un proyecto'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Camion>(
            initialValue: _camion,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Camión',
              border: OutlineInputBorder(),
            ),
            items: _camiones
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(
                      _nombreCamion(item),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: _enviando
                ? null
                : (valor) => setState(() => _camion = valor),
            validator: (valor) => _requerido(valor, 'un camión'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Ubicacion>(
            key: ValueKey('origen-${_proyecto?.id}-${_origen?.id}'),
            initialValue: _origen,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Origen',
              border: OutlineInputBorder(),
            ),
            items: _origenesDisponibles
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(item.nombre, overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: _enviando || _proyecto == null
                ? null
                : (valor) => setState(() => _origen = valor),
            validator: (valor) => _requerido(valor, 'un origen'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Ubicacion>(
            key: ValueKey('destino-${_proyecto?.id}-${_destino?.id}'),
            initialValue: _destino,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Destino',
              border: OutlineInputBorder(),
            ),
            items: _destinosDisponibles
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(item.nombre, overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: _enviando || _proyecto == null
                ? null
                : (valor) => setState(() => _destino = valor),
            validator: (valor) => _requerido(valor, 'un destino'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<catalogo.Material>(
            initialValue: _material,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Material',
              border: OutlineInputBorder(),
            ),
            items: _materiales
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(
                      '${item.nombre} (${item.unidadMedida})',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: _enviando
                ? null
                : (valor) => setState(() => _material = valor),
            validator: (valor) => _requerido(valor, 'un material'),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _cantidadController,
            enabled: !_enviando,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: _material == null
                  ? 'Cantidad de salida'
                  : 'Cantidad de salida (${_material!.unidadMedida})',
              border: const OutlineInputBorder(),
              helperText: 'Número positivo, máximo 3 decimales.',
            ),
            validator: (valor) => normalizarCantidadSalida(valor ?? '') == null
                ? 'Ingresa una cantidad válida.'
                : null,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Chofer>(
            initialValue: _chofer,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Chofer',
              border: OutlineInputBorder(),
            ),
            items: _choferes
                .map(
                  (item) => DropdownMenuItem(
                    value: item,
                    child: Text(
                      item.nombreCompleto,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: _enviando
                ? null
                : (valor) => setState(() => _chofer = valor),
            validator: (valor) => _requerido(valor, 'un chofer'),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _observacionesController,
            enabled: !_enviando,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Observaciones (opcional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _enviando ? null : _confirmarYRegistrar,
            icon: _enviando
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.local_shipping_outlined),
            label: Text(_enviando ? 'REGISTRANDO...' : 'REGISTRAR SALIDA'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(56),
            ),
          ),
        ],
      ),
    );
  }
}
