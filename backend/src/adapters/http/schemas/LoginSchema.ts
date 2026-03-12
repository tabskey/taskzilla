import { z } from 'zod';

export const LoginSchema = z.object({
  email:    z.email({ error: 'Email inválido' }),
  password: z.string({ error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;