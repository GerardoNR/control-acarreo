import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdministradorDto } from '../../administradores/dto/create-administrador.dto';
import { UpdateAdministradorDto } from '../../administradores/dto/update-administrador.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { CreateCamionDto } from '../../camiones/dto/create-camion.dto';
import { UpdateCamionDto } from '../../camiones/dto/update-camion.dto';
import { CreateChoferDto } from '../../choferes/dto/create-chofer.dto';
import { CreateProyectoDto } from '../../proyectos/dto/create-proyecto.dto';
import { CreateUbicacionDto } from '../../ubicaciones/dto/create-ubicacion.dto';
import { TipoUbicacion } from '../../ubicaciones/ubicacion.entity';

describe('DTOs administrativos - identidad y strings', () => {
  it.each(["José María O'Neill", 'María-José', 'Íñigo Muñoz'])(
    'acepta el nombre personal %s',
    async (nombre) => {
      const dto = plainToInstance(CreateChoferDto, { nombre });
      expect(await validate(dto)).toHaveLength(0);
    },
  );

  it.each(['12345', '---', 'José_123', '   '])(
    'rechaza el nombre personal %s',
    async (nombre) => {
      const dto = plainToInstance(CreateChoferDto, { nombre });
      expect(
        (await validate(dto)).some((error) => error.property === 'nombre'),
      ).toBe(true);
    },
  );

  it('recorta nombres y normaliza usuarios sin tocar contraseñas', async () => {
    const dto = plainToInstance(CreateAdministradorDto, {
      nombre: '  Ana López  ',
      usuario: '  Ana.Admin  ',
      password: ' password ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      nombre: 'Ana López',
      usuario: 'ana.admin',
      password: ' password ',
    });
  });

  it('normaliza el mismo usuario en login', async () => {
    const dto = plainToInstance(LoginDto, {
      usuario: '  Ana.Admin  ',
      password: 'password',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.usuario).toBe('ana.admin');
  });

  it.each([
    [CreateProyectoDto, { nombre: '  Proyecto 12  ' }, 'Proyecto 12'],
    [
      CreateUbicacionDto,
      { proyecto_id: 1, nombre: '  Banco 4  ', tipo: TipoUbicacion.BANCO },
      'Banco 4',
    ],
  ])(
    'recorta nombres administrativos no personales',
    async (Dto, value, nombre) => {
      const dto = plainToInstance(Dto, value);
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.nombre).toBe(nombre);
    },
  );

  it('recorta campos de camión sin alterar su formato', async () => {
    const dto = plainToInstance(CreateCamionDto, {
      placas: ' abc-123 ',
      numero_economico: ' Eco 01 ',
      nfc_tag_uid: ' 04:a8:35 ',
      capacidad_m3: 20,
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      placas: 'abc-123',
      numero_economico: 'Eco 01',
      nfc_tag_uid: '04:a8:35',
    });
  });

  it.each([
    plainToInstance(UpdateAdministradorDto, {}),
    plainToInstance(UpdateCamionDto, {}),
  ])('mantiene opcionales todos los campos de Update DTO', async (dto) => {
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza un string opcional compuesto sólo por espacios', async () => {
    const dto = plainToInstance(UpdateCamionDto, { placas: '   ' });
    expect(
      (await validate(dto)).some((error) => error.property === 'placas'),
    ).toBe(true);
  });
});
