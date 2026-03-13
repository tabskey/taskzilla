import { GenerateTokensUseCase, RefreshTokenUseCase, RevokeTokensUseCase } from '../../core/application/use-cases/RefreshTokenUseCase';
import { IUserRepository } from '../../core/application/ports/IUserRepository';
import { IRefreshTokenRepository } from '../../core/application/ports/IRefreshTokenRepository';
import { User } from '../../core/domain/entities/User';
import { RefreshToken } from '../../core/domain/entities/RefreshToken';

const makeUserRepositoryMock = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findByEmail:     jest.fn().mockResolvedValue(null),
  findManyByEmail: jest.fn().mockResolvedValue([]),
  save:            jest.fn().mockResolvedValue(undefined),
  saveMany:        jest.fn().mockResolvedValue(undefined),
  linkGoogle:      jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeRefreshTokenRepositoryMock = (overrides?: Partial<IRefreshTokenRepository>): IRefreshTokenRepository => ({
  save:                 jest.fn().mockResolvedValue(undefined),
  findByToken:          jest.fn().mockResolvedValue(null),
  revokeByToken:        jest.fn().mockResolvedValue(undefined),
  revokeAllByUserEmail: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('GenerateTokensUseCase', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('deve gerar accessToken e refreshToken', async () => {
    const refreshTokenRepo = makeRefreshTokenRepositoryMock();
    const useCase          = new GenerateTokensUseCase(refreshTokenRepo);

    const result = await useCase.execute('alice@taskflow.io', 'member');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().accessToken).toBeDefined();
    expect(result.getValue().refreshToken).toBeDefined();
    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });

  it('deve falhar se JWT_SECRET não estiver definido', async () => {
    delete process.env.JWT_SECRET;

    const refreshTokenRepo = makeRefreshTokenRepositoryMock();
    const useCase          = new GenerateTokensUseCase(refreshTokenRepo);

    const result = await useCase.execute('alice@taskflow.io', 'member');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('JWT_SECRET_NOT_DEFINED');
  });

});

describe('RefreshTokenUseCase', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('deve gerar novo par de tokens com refresh token válido', async () => {
    const existingUser = User.reconstitute({
      name:         'Alice Costa',
      email:        'alice@taskflow.io',
      passwordHash: 'hash',
      authProvider: 'local',
      role:         'member',
    });

    const validRefreshToken = RefreshToken.reconstitute({
      token:     'valid_token',
      userEmail: 'alice@taskflow.io',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 dias
      revoked:   false,
    });

    const userRepo         = makeUserRepositoryMock({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
    const refreshTokenRepo = makeRefreshTokenRepositoryMock({ findByToken: jest.fn().mockResolvedValue(validRefreshToken) });
    const useCase          = new RefreshTokenUseCase(userRepo, refreshTokenRepo);

    const result = await useCase.execute('valid_token');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().accessToken).toBeDefined();
    expect(result.getValue().refreshToken).toBeDefined();
    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('valid_token');
    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });

  it('deve falhar com token não encontrado', async () => {
    const userRepo         = makeUserRepositoryMock();
    const refreshTokenRepo = makeRefreshTokenRepositoryMock();
    const useCase          = new RefreshTokenUseCase(userRepo, refreshTokenRepo);

    const result = await useCase.execute('token_inexistente');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('REFRESH_TOKEN_NOT_FOUND');
  });

  it('deve falhar com token revogado', async () => {
    const revokedToken = RefreshToken.reconstitute({
      token:     'revoked_token',
      userEmail: 'alice@taskflow.io',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      revoked:   true,
    });

    const userRepo         = makeUserRepositoryMock();
    const refreshTokenRepo = makeRefreshTokenRepositoryMock({ findByToken: jest.fn().mockResolvedValue(revokedToken) });
    const useCase          = new RefreshTokenUseCase(userRepo, refreshTokenRepo);

    const result = await useCase.execute('revoked_token');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('REFRESH_TOKEN_REVOKED');
  });

  it('deve falhar com token expirado', async () => {
    const expiredToken = RefreshToken.reconstitute({
      token:     'expired_token',
      userEmail: 'alice@taskflow.io',
      expiresAt: new Date(Date.now() - 1000), // expirado
      revoked:   false,
    });

    const userRepo         = makeUserRepositoryMock();
    const refreshTokenRepo = makeRefreshTokenRepositoryMock({ findByToken: jest.fn().mockResolvedValue(expiredToken) });
    const useCase          = new RefreshTokenUseCase(userRepo, refreshTokenRepo);

    const result = await useCase.execute('expired_token');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('REFRESH_TOKEN_EXPIRED');
  });

});

describe('RevokeTokensUseCase', () => {

  it('deve revogar todos os tokens do usuário', async () => {
    const refreshTokenRepo = makeRefreshTokenRepositoryMock();
    const useCase          = new RevokeTokensUseCase(refreshTokenRepo);

    const result = await useCase.execute('alice@taskflow.io');

    expect(result.isSuccess).toBe(true);
    expect(refreshTokenRepo.revokeAllByUserEmail).toHaveBeenCalledWith('alice@taskflow.io');
  });

});