import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../models/camion.dart';
import '../../models/registrar_llegada_request.dart';
import '../../models/viaje.dart';
import '../../services/catalogos_service.dart';
import '../../services/viajes_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_state_view.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/status_badge.dart';

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

  String _identificadorCamion(Camion camion) {
    final numero = camion.numeroEconomico?.trim();
    return numero == null || numero.isEmpty ? camion.placas : numero;
  }

  TripStatus _estadoVisual(String estado) {
    return switch (estado) {
      'completado' => TripStatus.completed,
      'cancelado' => TripStatus.cancelled,
      _ => TripStatus.inTransit,
    };
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
      return const AppStateView.loading(message: 'Cargando camiones...');
    }

    if (_errorCatalogo != null) {
      return AppStateView.error(
        message: _errorCatalogo!,
        onRetry: _cargarCamiones,
      );
    }

    final colors = AppColors.of(context);
    final textTheme = Theme.of(context).textTheme;
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.mobileHorizontal,
        AppSpacing.md,
        AppSpacing.mobileHorizontal,
        AppSpacing.xl,
      ),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'CONSULTA DE UNIDAD',
                  style: textTheme.labelLarge?.copyWith(
                    color: colors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Selecciona la unidad que llegó al destino',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                AppCard(
                  child: Column(
                    children: [
                      DropdownButtonFormField<Camion>(
                        initialValue: _camionSeleccionado,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Camión',
                          prefixIcon: Icon(Icons.local_shipping_outlined),
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
                      const SizedBox(height: AppSpacing.md),
                      PrimaryButton(
                        label: _consultando
                            ? 'CONSULTANDO...'
                            : 'CONSULTAR VIAJE',
                        icon: Icons.search,
                        isLoading: _consultando,
                        onPressed:
                            _camionSeleccionado == null || _registrandoLlegada
                            ? null
                            : _consultarViaje,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (_mensajeExito != null)
                  _mensajeEstado(
                    mensaje: _mensajeExito!,
                    icono: Icons.check_circle_outline,
                    color: colors.success,
                  ),
                if (_camionSeleccionado == null && !_consultando)
                  _mensajeEstado(
                    mensaje:
                        'Selecciona un camión para consultar su viaje activo.',
                    icono: Icons.touch_app_outlined,
                    color: colors.info,
                  ),
                if (_errorConsulta != null)
                  _mensajeEstado(
                    mensaje: _errorConsulta!,
                    icono: Icons.error_outline,
                    color: colors.error,
                  ),
                if (_sinViaje)
                  _mensajeEstado(
                    mensaje:
                        'Este camión no tiene un viaje activo actualmente.',
                    icono: Icons.route_outlined,
                    color: colors.textSecondary,
                  ),
                if (_viaje != null) _detalleViaje(_viaje!),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _detalleViaje(Viaje viaje) {
    final colors = AppColors.of(context);
    final textTheme = Theme.of(context).textTheme;
    final observaciones = viaje.observacionesSalida?.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'VIAJE EN CURSO',
          style: textTheme.labelLarge?.copyWith(
            color: colors.textSecondary,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        AppCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: colors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  child: Icon(
                    Icons.local_shipping_outlined,
                    color: colors.primary,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _identificadorCamion(viaje.camion),
                      style: textTheme.titleLarge,
                    ),
                    if (_identificadorCamion(viaje.camion) !=
                        viaje.camion.placas)
                      Text(
                        viaje.camion.placas,
                        style: textTheme.bodyMedium?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    const SizedBox(height: AppSpacing.sm),
                    StatusBadge(status: _estadoVisual(viaje.estado)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _tituloSeccion('RUTA'),
        const SizedBox(height: AppSpacing.xs),
        AppCard(
          child: Column(
            children: [
              _puntoRuta(
                icono: Icons.trip_origin,
                etiqueta: 'Origen',
                valor: viaje.ubicacionOrigen.nombre,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                child: Icon(
                  Icons.arrow_downward,
                  size: 20,
                  color: colors.textSecondary,
                ),
              ),
              _puntoRuta(
                icono: Icons.location_on_outlined,
                etiqueta: 'Destino',
                valor: viaje.ubicacionDestino.nombre,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _tituloSeccion('DETALLES DEL VIAJE'),
        const SizedBox(height: AppSpacing.xs),
        AppCard(
          child: Column(
            children: [
              _dato('Proyecto', viaje.proyecto.nombre),
              _dato('Material', viaje.material.nombre),
              _dato(
                'Cantidad de salida',
                '${viaje.cantidadSalida} ${viaje.unidadMedida}',
              ),
              _dato('Chofer', viaje.chofer.nombreCompleto),
              _dato('Folio', viaje.folio),
              _dato(
                'Fecha y hora de salida',
                _formatearFecha(viaje.fechaHoraSalida),
                ultimo: observaciones == null || observaciones.isEmpty,
              ),
              if (observaciones != null && observaciones.isNotEmpty)
                _dato('Nota de salida', observaciones, ultimo: true),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        PrimaryButton(
          label: _registrandoLlegada
              ? 'REGISTRANDO LLEGADA...'
              : 'REGISTRAR LLEGADA',
          icon: Icons.task_alt,
          isLoading: _registrandoLlegada,
          onPressed: () => _iniciarRegistroLlegada(viaje),
        ),
      ],
    );
  }

  Widget _mensajeEstado({
    required String mensaje,
    required IconData icono,
    required Color color,
  }) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Row(
        children: [
          Icon(icono, color: color),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(mensaje)),
        ],
      ),
    );
  }

  Widget _tituloSeccion(String titulo) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: AppSpacing.xxs),
      child: Text(
        titulo,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: colors.textSecondary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.9,
        ),
      ),
    );
  }

  Widget _puntoRuta({
    required IconData icono,
    required String etiqueta,
    required String valor,
  }) {
    final colors = AppColors.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icono, color: colors.primary, size: 22),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                etiqueta,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
              ),
              Text(valor, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ],
    );
  }

  Widget _dato(String etiqueta, String valor, {bool ultimo = false}) {
    final colors = AppColors.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: ultimo ? 0 : AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              etiqueta,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            flex: 6,
            child: Text(
              valor,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
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
    final colors = AppColors.of(context);
    return AlertDialog(
      title: const Text('Registrar llegada'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.local_shipping_outlined, color: colors.primary),
                  const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.nombreCamion,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(
                          viaje.folio,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _cantidadController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: InputDecoration(
                  labelText: 'Cantidad de llegada',
                  prefixIcon: const Icon(Icons.scale_outlined),
                  suffixText: viaje.unidadMedida,
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
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _observacionesController,
                minLines: 2,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Nota',
                  hintText: 'Agregar una nota (opcional)...',
                  alignLabelWithHint: true,
                  prefixIcon: Icon(Icons.notes_outlined),
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
