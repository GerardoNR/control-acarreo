import 'package:shared_preferences/shared_preferences.dart';

class TokenService {
  static const String _accessTokenKey = 'access_token';

  Future<void> guardarToken(String token) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_accessTokenKey, token);
  }

  Future<String?> obtenerToken() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_accessTokenKey);
  }

  Future<bool> hayToken() async {
    final token = await obtenerToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> eliminarToken() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_accessTokenKey);
  }
}
