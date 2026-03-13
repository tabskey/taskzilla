import { CreateUserUseCase } from '../../core/application/use-cases/CreateUserUseCase';
import { IUserRepository } from '../../core/application/ports/IUserRepository';
import { UserErrors } from '../../core/domain/errors/UserErrors';
import { User } from '../../core/domain/entities/User';

// mock do repositório — sem banco de dados
const makeRepositoryMock = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findByEmail:     jest.fn().mockResolvedValue(null),
  findManyByEmail: jest.fn().mockResolvedValue([]),
  save:            jest.fn().mockResolvedValue(undefined),
  saveMany:        jest.fn().mockResolvedValue(undefined),
  linkGoogle:      jest.fn().mockResolvedValue(undefined),
  ...overrides,
});
describe('CreateUserUseCase', () => {

  const validDTO = {
    name:     'Alice Costa',
    email:    'alice@taskflow.io',
    password: '123456',
  };

  it('deve criar um usuário com dados válidos', async () => {
    const repo    = makeRepositoryMock();
    const useCase = new CreateUserUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name).toBe('Alice Costa');
    expect(result.getValue().email).toBe('alice@taskflow.io');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('deve falhar se email já estiver em uso', async () => {
    const existingUser = User.create({
    name:         'Alice Costa',
    email:        'alice@taskflow.io',
    passwordHash: 'hash',
    authProvider: 'local',
  }).getValue();

    const repo    = makeRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const useCase = new CreateUserUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.EMAIL_IN_USE);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deve falhar com email inválido', async () => {
    const repo    = makeRepositoryMock();
    const useCase = new CreateUserUseCase(repo);

    const result = await useCase.execute({ ...validDTO, email: 'email-invalido' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.INVALID_EMAIL);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deve falhar com nome inválido', async () => {
    const repo    = makeRepositoryMock();
    const useCase = new CreateUserUseCase(repo);

    const result = await useCase.execute({ ...validDTO, name: 'A' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(UserErrors.INVALID_NAME);
    expect(repo.save).not.toHaveBeenCalled();
  });

});