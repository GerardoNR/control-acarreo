import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number;
  usuario: string;
  rol: Role;
}
