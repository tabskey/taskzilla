import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import { connectMongo } from './infra/mongoose/conn';
import { app } from './app';

async function main(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI não definida nas variáveis de ambiente');
  }
  await connectMongo(mongoUri);
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
  });
}

main().catch(console.error);