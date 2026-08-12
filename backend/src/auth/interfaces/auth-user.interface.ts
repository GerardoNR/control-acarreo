import { Role } from '../enums/role.enum';

export interface AuthUser {
  id: number;
  nombre: string;
  usuario: string;
  rol: Role;
}
