import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../models/camion.dart';
import '../../models/registrar_llegada_request.dart';
import '../../models/viaje.dart';
import '../../services/catalogos_service.dart';
import '../../services/viajes_service.dart';

double? normalizarCantidadLlegada(String texto) {
  final valor = texto.trim();
  if (valor.isEmpty) return null;
  if (!RegExp(r'^\d+(?:[.,]\d{1,3})?$').hasMatch(valor)) return null;

  final cantidad = double.tryParse(valor.replaceAll(',', '.'));
  if (cantidad == null ||
      !cantidad.isFinite ||
      cantidad <= 0 ||
      cantidad > 999999999.999) {
    return null;
  }
  return cantidad;
}

class ViajeActivoScreen extends StatefulWidget {
  const ViajeActivoScreen({
    super.key,
    this.catalogosService,
    this.viajesService,
  });

  final CatalogosService? catalogosService;
  final ViajesService? viajesService;

  @override
  State<ViajeActivoScreen> createState() => _ViajeActivoScreenState();
}

class _ViajeActivoScreenState extends State<ViajeActivoScreen> {
  late final CatalogosService _catalogosService;
  late final ViajesService _viajesService;

  List<Camion> _camiones = [];
  Camion? _camionSeleccionado;
  Viaje? _viaje;
  bool _cargandoCatalogo = true;
  bool _consultando = false;
  bool _registrandoLlegada = false;
  bool _sinViaje = false;
  String? _errorCatalogo;
  String? _errorConsulta;
  String? _mensajeExito;

  @override
  void initState() {
    super.initState();
    _catalogosService = widget.catalogosService ?? CatalogosService();
    _viajesService = widget.viajesService ?? ViajesService();
    _cargarCamiones();
  }

  Future<void> _cargarCamiones() async {
    setState(() {
      _cargandoCatalogo = true;
      _errorCatalogo = null;
    });
    try {
      final camiones = await _catalogosService.obtenerCamiones();
      if (!mounted) return;
      setState(() {
        _camiones = camiones
            .where((camion) => camion.activo)
            .toList(growable: false);
        _cargandoCatalogo = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _cargandoCatalogo = false;
        _errorCatalogo = _mensajeError(error, cargandoCatalogo: true);
      });
    }
  }

  void _seleccionarCamion(Camion? camion) {
    setState(() {
      _camionSeleccionado = camion;
      _viaje = null;
      _sinViaje = false;
      _errorConsulta = null;
      _mensajeExito = null;
    });
  }

  Future<void> _consultarViaje({bool conservarMensaje = false}) async {
    final camion = _camionSeleccionado;
    if (camion == null || _consultando) return;

    setState(() {
      _consultando = true;
      _viaje = null;
      _sinViaje = false;
      _errorConsulta = null;
      if (!conservarMensaje) _mensajeExito = null;
    });
    try {
      final viaje = await _viajesService.obtenerViajeActivoPorCamion(camion.id);
      if (!mounted) return;
      setState(() {
        _viaje = viaje;
        _sinViaje = viaje == null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorConsulta = _mensajeError(error));
    } finally {
      if (mounted) setState(() => _consultando = false);
    }
  }

  Future<void> _iniciarRegistroLlegada(Viaje viaje) async {
    if (_registrandoLlegada) return;

    final request = await showDialog<RegistrarLlegadaRequest>(
      context: context,
      builder: (dialogContext) => _RegistrarLlegadaDialog(
        viaje: viaje,
        nombreCamion: _nombreCamion(viaje.camion),
      ),
    );
    if (request == null || !mounted) return;

    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('¿Confirmar llegada?'),
        content: Text(
          'Folio: ${viaje.folio}\n'
          'Camión: ${_nombreCamion(viaje.camion)}\n'
          'Cantidad de llegada: '
          '${request.cantidadLlegada?.toString() ?? 'Sin cantidad'} '
          '${viaje.unidadMedida}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('CANCELAR'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('CONFIRMAR'),
          ),
        ],
      ),
    );
    if (confirmado != true || !mounted) return;

    setState(() {
      _registrandoLlegada = true;
      _errorConsulta = null;
      _mensajeExito = null;
    });
    try {
      final actualizado = await _viajesService.registrarLlegada(
        viaje.id,
        request,
      );
      if (!mounted) return;
      await _mostrarLlegadaRegistrada(actualizado);
      if (!mounted) return;
      setState(() {
        _mensajeExito = 'Llegada registrada correctamente.';
      });
      await _consultarViaje(conservarMensaje: true);
    } catch (error) {
      if (!mounted) return;
      final codigo = error is DioException ? error.response?.statusCode : null;
      setState(() => _errorConsulta = _mensajeErrorLlegada(error));
      if (codigo == 404 || codigo == 409) {
        await _refrescarTrasLlegadaNoDisponible();
      }
    } finally {
      if (mounted) setState(() => _registrandoLlegada = false);
    }
  }

  Future<void> _refrescarTrasLlegadaNoDisponible() async {
    final camion = _camionSeleccionado;
    if (camion == null) return;
    try {
      final viaje = await _viajesService.obtenerViajeActivoPorCamion(camion.id);
      if (!mounted) return;
      setState(() {
        _viaje = viaje;
        _sinViaje = viaje == null;
      });
    } catch (_) {
      // Se conserva el mensaje original de la operación de llegada.
    }
  }

  Future<void> _mostrarLlegadaRegistrada(Viaje viaje) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Text('LLEGADA REGISTRADA'),
        content: Text(
          'Folio: ${viaje.folio}\n'
          'Estado: ${viaje.estado}\n'
          'Cantidad de llegada: '
          '${viaje.cantidadLlegada ?? 'Sin cantidad'} ${viaje.unidadMedida}',
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

  String _mensajeErrorLlegada(Object error) {
    if (error is DioException) {
      switch (error.response?.statusCode) {
        case 400:
          return 'Los datos de llegada no son válidos.';
        case 401:
          return 'La sesión no es válida o expiró.';
        case 403:
          return 'No tienes permiso para registrar llegadas.';
        case 404:
          return 'El viaje ya no está disponible.';
        case 409:
          return 'El viaje ya no está en tránsito. Actualizamos la consulta.';
      }
      if (error.response == null) {
        return 'No se pudo conectar con el servidor.';
      }
    }
    return 'No se pudo registrar la llegada.';
  }

  String _mensajeError(Object error, {bool cargandoCatalogo = false}) {
    if (error is DioException) {
      final codigo = error.response?.statusCode;
      switch (codigo) {
        case 400:
          return 'La consulta contiene datos inválidos.';
        case 401:
          return 'La sesión no es válida o expiró.';
        case 403:
          return 'No tienes permiso para consultar viajes.';
      }
      if (error.response == null) {
        return 'No se pudo conectar con el servidor.';
      }
    }
    return cargandoCatalogo
        ? 'No se pudo cargar el catálogo de camiones.'
        : 'No se pudo consultar el viaje activo.';
  }

  String _nombreCamion(Camion camion) {
    final numero = camion.numeroEconomico?.trim();
    return numero == null || numero.isEmpty
        ? camion.placas
        : '$numero · ${camion.placas}';
  }

  String _formatearFecha(String valor) {
    final fecha = DateTime.tryParse(valor)?.toLocal();
    if (fecha == null) return valor;
    String dosDigitos(int numero) => numero.toString().padLeft(2, '0');
    return '${dosDigitos(fecha.day)}/${dosDigitos(fecha.month)}/${fecha.year} '
        '${dosDigitos(fecha.hour)}:${dosDigitos(fecha.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Viaje activo')),
      body: SafeArea(child: _construirContenido()),
    );
  }

  Widget _construirContenido() {
    if (_cargandoCatalogo) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Cargando camiones...'),
          ],
        ),
      );
    }

    if (_errorCatalogo != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_errorCatalogo!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _cargarCamiones,
                icon: const Icon(Icons.refresh),
                label: const Text('REINTENTAR'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        DropdownButtonFormField<Camion>(
          initialValue: _camionSeleccionado,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Camión',
            border: OutlineInputBorder(),
          ),
          items: _camiones
              .map(
                (camion) => DropdownMenuItem(
                  value: camion,
                  child: Text(
                    _nombreCamion(camion),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              )
              .toList(),
          onChanged: _consultando || _registrandoLlegada
              ? null
              : _seleccionarCamion,
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed:
              _camionSeleccionado == null || _consultando || _registrandoLlegada
              ? null
              : _consultarViaje,
          icon: _consultando
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.search),
          label: Text(_consultando ? 'CONSULTANDO...' : 'CONSULTAR VIAJE'),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        ),
        const SizedBox(height: 24),
        if (_mensajeExito != null)
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(_mensajeExito!, textAlign: TextAlign.center),
            ),
          ),
        if (_camionSeleccionado == null && !_consultando)
          const Text(
            'Selecciona un camión para consultar su viaje activo.',
            textAlign: TextAlign.center,
          ),
        if (_errorConsulta != null)
          Card(
            color: Theme.of(context).colorScheme.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(_errorConsulta!, textAlign: TextAlign.center),
            ),
          ),
        if (_sinViaje)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text(
                'Este camión no tiene un viaje activo actualmente.',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        if (_viaje != null) _detalleViaje(_viaje!),
      ],
    );
  }

  Widget _detalleViaje(Viaje viaje) {
    final observaciones = viaje.observacionesSalida?.trim();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(viaje.folio, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text('Estado: ${viaje.estado}'),
            const Divider(height: 24),
            _dato('Proyecto', viaje.proyecto.nombre),
            _dato('Camión', _nombreCamion(viaje.camion)),
            _dato('Chofer', viaje.chofer.nombreCompleto),
            _dato('Material', viaje.material.nombre),
            _dato(
              'Cantidad de salida',
              '${viaje.cantidadSalida} ${viaje.unidadMedida}',
            ),
            _dato('Origen', viaje.ubicacionOrigen.nombre),
            _dato('Destino', viaje.ubicacionDestino.nombre),
            _dato(
              'Fecha y hora de salida',
              _formatearFecha(viaje.fechaHoraSalida),
            ),
            if (observaciones != null && observaciones.isNotEmpty)
              _dato('Observaciones', observaciones),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _registrandoLlegada
                  ? null
                  : () => _iniciarRegistroLlegada(viaje),
              icon: _registrandoLlegada
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.task_alt),
              label: Text(
                _registrandoLlegada
                    ? 'REGISTRANDO LLEGADA...'
                    : 'REGISTRAR LLEGADA',
              ),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dato(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(etiqueta, style: Theme.of(context).textTheme.labelLarge),
          Text(valor),
        ],
      ),
    );
  }
}

class _RegistrarLlegadaDialog extends StatefulWidget {
  const _RegistrarLlegadaDialog({
    required this.viaje,
    required this.nombreCamion,
  });

  final Viaje viaje;
  final String nombreCamion;

  @override
  State<_RegistrarLlegadaDialog> createState() =>
      _RegistrarLlegadaDialogState();
}

class _RegistrarLlegadaDialogState extends State<_RegistrarLlegadaDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _cantidadController;
  final _observacionesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cantidadController = TextEditingController(
      text: widget.viaje.cantidadSalida,
    );
  }

  @override
  void dispose() {
    _cantidadController.dispose();
    _observacionesController.dispose();
    super.dispose();
  }

  void _continuar() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final cantidadTexto = _cantidadController.text.trim();
    final observaciones = _observacionesController.text.trim();
    Navigator.pop(
      context,
      RegistrarLlegadaRequest(
        cantidadLlegada: cantidadTexto.isEmpty
            ? null
            : normalizarCantidadLlegada(cantidadTexto),
        observacionesLlegada: observaciones.isEmpty ? null : observaciones,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viaje = widget.viaje;
    return AlertDialog(
      title: const Text('Registrar llegada'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Folio: ${viaje.folio}'),
              Text('Camión: ${widget.nombreCamion}'),
              const SizedBox(height: 16),
              TextFormField(
                controller: _cantidadController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: InputDecoration(
                  labelText: 'Cantidad de llegada (${viaje.unidadMedida})',
                  border: const OutlineInputBorder(),
                  helperText: 'Opcional. Máximo 3 decimales.',
                ),
                validator: (texto) {
                  final valor = texto?.trim() ?? '';
                  if (valor.isEmpty) return null;
                  return normalizarCantidadLlegada(valor) == null
                      ? 'Ingresa una cantidad válida.'
                      : null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _observacionesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Observaciones de llegada (opcional)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('CANCELAR'),
        ),
        FilledButton(onPressed: _continuar, child: const Text('CONTINUAR')),
      ],
    );
  }
}
