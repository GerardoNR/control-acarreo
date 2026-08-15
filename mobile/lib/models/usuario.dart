class Usuario {
  const Usuario({
    required this.id,
    required this.nombre,
    required this.usuario,
    required this.rol,
  });

  final int id;
  final String nombre;
  final String usuario;
  final String rol;

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as int,
      nombre: json['nombre'] as String,
      usuario: json['usuario'] as String,
      rol: json['rol'] as String,
    );
  }
}
