import { connectMongo } from "./infra/mongoose/conn";
import { app } from "./app"; 

async function main(): Promise<void> {
  await connectMongo(process.env.MONGO_URI!);
  
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
  });
}

main().catch(console.error);