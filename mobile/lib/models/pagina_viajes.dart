import 'viaje.dart';

class PaginaViajes {
  const PaginaViajes({
    required this.viajes,
    required this.pagina,
    required this.limite,
    required this.total,
    required this.totalPaginas,
  });

  final List<Viaje> viajes;
  final int pagina;
  final int limite;
  final int total;
  final int totalPaginas;

  factory PaginaViajes.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    final meta = json['meta'];
    if (data is! List<dynamic> || meta is! Map<String, dynamic>) {
      throw const FormatException('La página de viajes no es válida.');
    }

    return PaginaViajes(
      viajes: data
          .map((item) => Viaje.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      pagina: meta['page'] as int,
      limite: meta['limit'] as int,
      total: meta['total'] as int,
      totalPaginas: meta['total_pages'] as int,
    );
  }
}
