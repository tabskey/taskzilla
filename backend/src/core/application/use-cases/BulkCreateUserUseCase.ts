import { IUserRepository } from '../ports/IUserRepository';
import { UserErrors } from '../../domain/errors/UserErrors';
import { User } from '../../domain/entities/User';
import { Result } from '../../shared/Results';
import bcrypt from 'bcrypt';

interface BulkCreateUserDTO {
  name:     string;
  email:    string;
  password: string;
}

interface BulkCreateUserResult {
  created: { name: string; email: string }[];
  failed:  { email: string; reason: string }[];
}

const MAX_BULK_SIZE = 1000;

export class BulkCreateUserUseCase {

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dtos: BulkCreateUserDTO[]): Promise<Result<BulkCreateUserResult>> {
    if (dtos.length > MAX_BULK_SIZE) {
      return Result.fail(`BULK_LIMIT_EXCEEDED: máximo de ${MAX_BULK_SIZE} registros por operação`);
    }

    // 1. verifica emails duplicados dentro do próprio lote
    const emailsNoLote = dtos.map(d => d.email.toLowerCase());
    const emailsUnicos = new Set(emailsNoLote);

    if (emailsUnicos.size !== emailsNoLote.length) {
      return Result.fail('BULK_DUPLICATE_EMAILS: existem emails duplicados no lote');
    }

    // 2. busca todos os emails já existentes no banco de uma vez só
    const existentes = await this.userRepository.findManyByEmail(Array.from(emailsUnicos));
    const emailsExistentes = new Set(existentes.map(u => u.email.toLowerCase()));

    const created: { name: string; email: string }[] = [];
    const failed:  { email: string; reason: string }[] = [];
    const usersParaSalvar: User[] = [];

    // 3. valida cada item do lote
    for (const dto of dtos) {
      if (emailsExistentes.has(dto.email.toLowerCase())) {
        failed.push({ email: dto.email, reason: UserErrors.EMAIL_IN_USE });
        continue;
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const userResult   = User.create({ name: dto.name, email: dto.email, passwordHash });

      if (userResult.isFailure) {
        failed.push({ email: dto.email, reason: userResult.error! });
        continue;
      }

      usersParaSalvar.push(userResult.getValue());
      created.push({ name: dto.name, email: dto.email });
    }

    // 4. salva todos de uma vez (insertMany)
    if (usersParaSalvar.length > 0) {
      await this.userRepository.saveMany(usersParaSalvar);
    }

    return Result.ok({ created, failed });
  }
}