import '../models/usuario.dart';
import 'api_service.dart';
import 'token_service.dart';

class AuthService {
  AuthService({ApiService? apiService, TokenService? tokenService}) {
    _tokenService = tokenService ?? TokenService();
    _apiService = apiService ?? ApiService(tokenService: _tokenService);
  }

  late final ApiService _apiService;
  late final TokenService _tokenService;

  Future<void> login({
    required String usuario,
    required String password,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'usuario': usuario, 'password': password},
    );
    final token = response.data?['access_token'] as String;
    await _tokenService.guardarToken(token);
  }

  Future<Usuario> obtenerPerfil() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/auth/profile',
      autenticado: true,
    );
    return Usuario.fromJson(response.data!);
  }

  Future<bool> haySesion() => _tokenService.hayToken();

  Future<void> logout() => _tokenService.eliminarToken();
}
