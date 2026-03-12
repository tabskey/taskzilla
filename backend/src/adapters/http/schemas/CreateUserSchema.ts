import { z } from 'zod';

export const CreateUserSchema = z.object({
  name:     z.string({ error: 'Nome é obrigatório' }).min(2, 'Nome deve ter ao menos 2 caracteres').trim(),
  email:    z.email({ error: 'Email inválido' }),
  password: z.string({ error: 'Senha é obrigatória' }).min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;