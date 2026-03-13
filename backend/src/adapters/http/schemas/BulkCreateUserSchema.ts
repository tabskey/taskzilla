import { z } from 'zod';

const UserItemSchema = z.object({
  name:     z.string({ error: 'Nome é obrigatório' }).min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:    z.email({ error: 'Email inválido' }),
  password: z.string({ error: 'Senha é obrigatória' }).min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const BulkCreateUserSchema = z.array(UserItemSchema)
  .min(1,    'O lote deve ter pelo menos 1 item')
  .max(1000, 'O lote não pode exceder 1000 itens');

export type BulkCreateUserDTO = z.infer<typeof BulkCreateUserSchema>;