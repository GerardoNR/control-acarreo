import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../models/camion.dart';
import '../../models/pagina_viajes.dart';
import '../../models/proyecto.dart';
import '../../models/viaje.dart';
import '../../services/catalogos_service.dart';
import '../../services/viajes_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radius.dart';
import '../../theme/app_spacing.dart';
import '../../widgets/app_card.dart';
import '../../widgets/status_badge.dart';
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
    const meses = <String>[
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return '${fecha.day} ${meses[fecha.month - 1]} ${fecha.year} · '
        '${dos(fecha.hour)}:${dos(fecha.minute)}';
  }

  TripStatus? _estadoVisual(String estado) => switch (estado) {
    'en_transito' => TripStatus.inTransit,
    'completado' => TripStatus.completed,
    'cancelado' => TripStatus.cancelled,
    _ => null,
  };

  String _textoEstadoSeleccionado() {
    if (_estado == null) return 'Todos los estados';
    return _estados[_estado] ?? _estado!;
  }

  void _seleccionarEstado(String? estado) {
    setState(() => _estado = estado);
    _aplicarFiltros();
  }

  void _abrirDetalle(Viaje viaje) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetalleViajeScreen(viaje: viaje)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historial')),
      body: SafeArea(child: _contenido()),
    );
  }

  Widget _contenido() {
    if (_cargandoInicial) {
      final colors = AppColors.of(context);
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Cargando historial...',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
            ),
          ],
        ),
      );
    }

    if (_resultado == null && _error != null) {
      return _estadoInicialError();
    }

    final resultado = _resultado!;
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
                  'HISTORIAL DE VIAJES',
                  style: textTheme.labelLarge?.copyWith(
                    color: colors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Consulta los movimientos registrados',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _selectorEstado(),
                const SizedBox(height: AppSpacing.sm),
                _filtrosAdicionales(),
                if (_consultando) ...[
                  const SizedBox(height: AppSpacing.sm),
                  const LinearProgressIndicator(),
                ],
                if (_error != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  _mensajeErrorConsulta(resultado.pagina),
                ],
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${resultado.total} ${resultado.total == 1 ? 'viaje' : 'viajes'}',
                        style: textTheme.titleSmall,
                      ),
                    ),
                    Text(
                      _textoEstadoSeleccionado(),
                      style: textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                if (resultado.viajes.isEmpty)
                  _estadoVacio()
                else
                  for (final viaje in resultado.viajes) _tarjeta(viaje),
                const SizedBox(height: AppSpacing.xs),
                _paginacion(resultado),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _estadoInicialError() {
    final colors = AppColors.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 42, color: colors.error),
            const SizedBox(height: AppSpacing.sm),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: AppSpacing.md),
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

  Widget _selectorEstado() {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.xs),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final ancho = (constraints.maxWidth - AppSpacing.xs) / 2;
          return Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              _opcionEstado(null, 'Todos', ancho),
              _opcionEstado('en_transito', 'En tránsito', ancho),
              _opcionEstado('completado', 'Completados', ancho),
              _opcionEstado('cancelado', 'Cancelados', ancho),
            ],
          );
        },
      ),
    );
  }

  Widget _opcionEstado(String? valor, String texto, double ancho) {
    final colors = AppColors.of(context);
    final seleccionado = _estado == valor;
    return SizedBox(
      width: ancho,
      child: ChoiceChip(
        label: SizedBox(
          width: double.infinity,
          child: Text(texto, textAlign: TextAlign.center),
        ),
        selected: seleccionado,
        showCheckmark: false,
        visualDensity: VisualDensity.compact,
        side: BorderSide(color: seleccionado ? colors.primary : colors.border),
        selectedColor: colors.primaryLight,
        backgroundColor: colors.surface,
        labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: seleccionado ? colors.primary : colors.textSecondary,
        ),
        onSelected: _consultando ? null : (_) => _seleccionarEstado(valor),
      ),
    );
  }

  Widget _filtrosAdicionales() {
    final colors = AppColors.of(context);
    return AppCard(
      padding: EdgeInsets.zero,
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        childrenPadding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          0,
          AppSpacing.md,
          AppSpacing.md,
        ),
        leading: Icon(Icons.tune, color: colors.primary),
        title: const Text('Buscar y filtrar'),
        subtitle: const Text('Folio, camión o proyecto'),
        children: [
          TextField(
            controller: _folioController,
            enabled: !_consultando,
            maxLength: 19,
            decoration: const InputDecoration(
              labelText: 'Folio',
              prefixIcon: Icon(Icons.confirmation_number_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          DropdownButtonFormField<Camion?>(
            initialValue: _camion,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Camión',
              prefixIcon: Icon(Icons.local_shipping_outlined),
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
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<Proyecto?>(
            initialValue: _proyecto,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Proyecto',
              prefixIcon: Icon(Icons.business_outlined),
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
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _consultando ? null : _limpiarFiltros,
                  child: const Text('LIMPIAR'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: FilledButton(
                  onPressed: _consultando ? null : _aplicarFiltros,
                  child: const Text('APLICAR'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mensajeErrorConsulta(int pagina) {
    final colors = AppColors.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: colors.error.withValues(alpha: 0.1),
        borderRadius: AppRadius.mediumBorder,
        border: Border.all(color: colors.error.withValues(alpha: 0.45)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colors.error),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(_error!)),
          TextButton(
            onPressed: _consultando ? null : () => _consultar(pagina),
            child: const Text('REINTENTAR'),
          ),
        ],
      ),
    );
  }

  Widget _estadoVacio() {
    final colors = AppColors.of(context);
    final estado = _estado == null
        ? 'viajes'
        : switch (_estado) {
            'en_transito' => 'viajes en tránsito',
            'completado' => 'viajes completados',
            'cancelado' => 'viajes cancelados',
            _ => 'viajes',
          };
    return AppCard(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Column(
          children: [
            Icon(Icons.history_toggle_off, size: 40, color: colors.primary),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'No hay $estado',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              'Cuando existan movimientos con estos filtros aparecerán aquí.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _paginacion(PaginaViajes resultado) {
    final colors = AppColors.of(context);
    return Row(
      children: [
        TextButton(
          onPressed: !_consultando && resultado.pagina > 1
              ? () => _consultar(resultado.pagina - 1)
              : null,
          child: const Text('ANTERIOR'),
        ),
        Expanded(
          child: Text(
            resultado.totalPaginas == 0
                ? 'Sin páginas'
                : 'Página ${resultado.pagina} de ${resultado.totalPaginas}',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
          ),
        ),
        TextButton(
          onPressed: !_consultando && resultado.pagina < resultado.totalPaginas
              ? () => _consultar(resultado.pagina + 1)
              : null,
          child: const Text('SIGUIENTE'),
        ),
      ],
    );
  }

  Widget _tarjeta(Viaje viaje) {
    final colors = AppColors.of(context);
    final textTheme = Theme.of(context).textTheme;
    final estado = _estadoVisual(viaje.estado);
    return AppCard(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      onTap: () => _abrirDetalle(viaje),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  viaje.folio,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              if (estado != null)
                StatusBadge(status: estado)
              else
                Text(
                  viaje.estado,
                  style: textTheme.labelMedium?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Icon(
                Icons.local_shipping_outlined,
                size: 18,
                color: colors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  _nombreCamion(viaje.camion),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          _puntoRutaTarjeta(
            icono: Icons.trip_origin,
            nombre: viaje.ubicacionOrigen.nombre,
          ),
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Icon(
              Icons.arrow_downward,
              size: 16,
              color: colors.textSecondary,
            ),
          ),
          _puntoRutaTarjeta(
            icono: Icons.location_on_outlined,
            nombre: viaje.ubicacionDestino.nombre,
          ),
          const SizedBox(height: AppSpacing.sm),
          Divider(height: 1, color: colors.border),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${viaje.material.nombre} · ${viaje.cantidadSalida} ${viaje.unidadMedida}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                _fecha(viaje.fechaHoraSalida),
                style: textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _puntoRutaTarjeta({required IconData icono, required String nombre}) {
    final colors = AppColors.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icono, size: 17, color: colors.primary),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            nombre,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
