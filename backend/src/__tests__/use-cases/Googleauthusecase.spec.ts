import { GoogleAuthUseCase } from '../../core/application/use-cases/GoogleAuthUseCase';
import { IUserRepository } from '../../core/application/ports/IUserRepository';
import { User } from '../../core/domain/entities/User';

const makeRepositoryMock = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findByEmail:     jest.fn().mockResolvedValue(null),
  findManyByEmail: jest.fn().mockResolvedValue([]),
  save:            jest.fn().mockResolvedValue(undefined),
  saveMany:        jest.fn().mockResolvedValue(undefined),
  linkGoogle:      jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const validDTO = {
  googleId: 'google_123',
  email:    'tabmacedo@gmail.com',
  name:     'Tabatha Macedo',
};

describe('GoogleAuthUseCase', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('deve criar conta nova para usuário que nunca se cadastrou', async () => {
    const newUser = User.reconstitute({
      name:         'Tabatha Macedo',
      email:        'tabmacedo@gmail.com',
      googleId:     'google_123',
      authProvider: 'google',
      role:         'member',
    });

    const findByEmailMock = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(newUser);

    const repo    = makeRepositoryMock({ findByEmail: findByEmailMock });
    const useCase = new GoogleAuthUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().token).toBeDefined();
    expect(result.getValue().user.email).toBe('tabmacedo@gmail.com');
    expect(result.getValue().user.authProvider).toBe('google');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.linkGoogle).not.toHaveBeenCalled();
  });

  it('deve vincular Google a conta local existente', async () => {
    const existingUser = User.reconstitute({
      name:         'Tabatha Macedo',
      email:        'tabmacedo@gmail.com',
      passwordHash: 'hashed_password',
      authProvider: 'local',
      role:         'member',
    });

    const findByEmailMock = jest.fn()
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(User.reconstitute({
        name:         'Tabatha Macedo',
        email:        'tabmacedo@gmail.com',
        passwordHash: 'hashed_password',
        googleId:     'google_123',
        authProvider: 'both',
        role:         'member',
      }));

    const repo    = makeRepositoryMock({ findByEmail: findByEmailMock });
    const useCase = new GoogleAuthUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().user.authProvider).toBe('both');
    expect(repo.linkGoogle).toHaveBeenCalledWith('tabmacedo@gmail.com', 'google_123');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deve fazer login normalmente se conta Google já existe', async () => {
    const existingUser = User.reconstitute({
      name:         'Tabatha Macedo',
      email:        'tabmacedo@gmail.com',
      googleId:     'google_123',
      authProvider: 'google',
      role:         'member',
    });

    const repo    = makeRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const useCase = new GoogleAuthUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().token).toBeDefined();
    expect(repo.linkGoogle).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deve falhar se JWT_SECRET não estiver definido', async () => {
    delete process.env.JWT_SECRET;

    const repo    = makeRepositoryMock();
    const useCase = new GoogleAuthUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('JWT_SECRET_NOT_DEFINED');
  });

  it('deve retornar token válido com role member por padrão', async () => {
    const newUser = User.reconstitute({
      name:         'Tabatha Macedo',
      email:        'tabmacedo@gmail.com',
      googleId:     'google_123',
      authProvider: 'google',
      role:         'member',
    });

    const findByEmailMock = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(newUser);

    const repo    = makeRepositoryMock({ findByEmail: findByEmailMock });
    const useCase = new GoogleAuthUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().user.role).toBe('member');
  });

});