import { DataSource } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL;
const databaseSsl = process.env.DATABASE_SSL !== 'false';

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está configurado');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: databaseSsl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
