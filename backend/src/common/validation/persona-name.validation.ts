import { Matches } from 'class-validator';

const PERSONA_NAME_PATTERN =
  /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

export const IsPersonaName = () =>
  Matches(PERSONA_NAME_PATTERN, {
    message:
      '$property sólo puede contener letras, espacios, apóstrofes y guiones',
  });
