import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'token_service.dart';

class ApiService {
  ApiService({TokenService? tokenService})
    : _tokenService = tokenService ?? TokenService(),
      _dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          headers: const {
            Headers.contentTypeHeader: Headers.jsonContentType,
            Headers.acceptHeader: Headers.jsonContentType,
          },
        ),
      );

  final Dio _dio;
  final TokenService _tokenService;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool autenticado = false,
  }) async {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: await _options(autenticado),
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    bool autenticado = false,
  }) async {
    return _dio.post<T>(path, data: data, options: await _options(autenticado));
  }

  Future<Response<T>> patch<T>(
    String path, {
    Object? data,
    bool autenticado = false,
  }) async {
    return _dio.patch<T>(
      path,
      data: data,
      options: await _options(autenticado),
    );
  }

  Future<Options?> _options(bool autenticado) async {
    if (!autenticado) return null;

    final token = await _tokenService.obtenerToken();
    if (token == null || token.isEmpty) return null;

    return Options(headers: {'Authorization': 'Bearer $token'});
  }
}
