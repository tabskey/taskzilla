import { LoginUseCase } from '../../core/application/use-cases/LoginUseCase';
import { IUserRepository } from '../../core/application/ports/IUserRepository';
import { UserErrors } from '../../core/domain/errors/UserErrors';
import { User } from '../../core/domain/entities/User';
import bcrypt from 'bcrypt';

const makeRepositoryMock = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findByEmail:     jest.fn().mockResolvedValue(null),
  findManyByEmail: jest.fn().mockResolvedValue([]),
  save:            jest.fn().mockResolvedValue(undefined),
  saveMany:        jest.fn().mockResolvedValue(undefined),
  linkGoogle:      jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('LoginUseCase', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('deve retornar token com credenciais válidas', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);

    const existingUser = User.create({
      name:         'Alice Costa',
      email:        'alice@taskflow.io',
      passwordHash,
      authProvider: 'local',
    }).getValue();

    const repo    = makeRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const useCase = new LoginUseCase(repo);

    const result = await useCase.execute({
      email:    'alice@taskflow.io',
      password: '123456',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().token).toBeDefined();
    expect(result.getValue().user.email).toBe('alice@taskflow.io');
  });

  it('deve falhar se usuário não existir', async () => {
    const repo    = makeRepositoryMock();
    const useCase = new LoginUseCase(repo);

    const result = await useCase.execute({
      email:    'naoexiste@taskflow.io',
      password: '123456',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.INVALID_CREDENTIALS);
  });

  it('deve falhar com senha incorreta', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);

   const existingUser = User.create({
    name:         'Alice Costa',
    email:        'alice@taskflow.io',
    passwordHash,
    authProvider: 'local',
  }).getValue();

    const repo    = makeRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const useCase = new LoginUseCase(repo);

    const result = await useCase.execute({
      email:    'alice@taskflow.io',
      password: 'senha_errada',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.INVALID_CREDENTIALS);
  });

});