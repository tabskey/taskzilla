import mongoose from 'mongoose';

export async function connectMongo(url: string): Promise<void> {
  if (!url) {
    throw new Error('MONGO_URI não definida nas variáveis de ambiente');
  }

  try {
    await mongoose.connect(url);
    console.log('Mongo connected');
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error);
    process.exit(1);
  }
}