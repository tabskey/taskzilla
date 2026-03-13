import { GetMeUseCase } from '../../core/application/use-cases/GetmeUseCase';
import { IUserRepository } from '../../core/application/ports/IUserRepository';
import { UserErrors } from '../../core/domain/errors/UserErrors';
import { User } from '../../core/domain/entities/User';

const makeRepositoryMock = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findByEmail:     jest.fn().mockResolvedValue(null),
  findManyByEmail: jest.fn().mockResolvedValue([]),
  save:            jest.fn().mockResolvedValue(undefined),
  saveMany:        jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('GetMeUseCase', () => {

  it('deve retornar os dados do usuário logado', async () => {
    const existingUser = User.create({
      name:         'Alice Costa',
      email:        'alice@taskflow.io',
      passwordHash: 'hash',
    }).getValue();

    const repo    = makeRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const useCase = new GetMeUseCase(repo);

    const result = await useCase.execute('alice@taskflow.io');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name).toBe('Alice Costa');
    expect(result.getValue().email).toBe('alice@taskflow.io');
    expect(result.getValue().role).toBe('member');
  });

  it('deve falhar se usuário não existir', async () => {
    const repo    = makeRepositoryMock();
    const useCase = new GetMeUseCase(repo);

    const result = await useCase.execute('naoexiste@taskflow.io');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.USER_NOT_FOUND);
  });

});