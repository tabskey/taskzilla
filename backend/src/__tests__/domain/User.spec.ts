import { User } from '../../core/domain/entities/User';
import { UserErrors } from '../../core/domain/errors/UserErrors';

describe('User Entity', () => {

  const validProps = {
    name:         'Alice Costa',
    email:        'alice@taskflow.io',
    passwordHash: 'hashed_password',
  };

  describe('create()', () => {

    it('deve criar um usuário válido', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().name).toBe('Alice Costa');
      expect(result.getValue().email).toBe('alice@taskflow.io');
      expect(result.getValue().role).toBe('member');
    });

    it('deve falhar com email inválido', () => {
      const result = User.create({ ...validProps, email: 'email-invalido' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(UserErrors.INVALID_EMAIL);
    });

    it('deve falhar com nome menor que 2 caracteres', () => {
      const result = User.create({ ...validProps, name: 'A' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(UserErrors.INVALID_NAME);
    });

    it('deve falhar com nome vazio', () => {
      const result = User.create({ ...validProps, name: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(UserErrors.INVALID_NAME);
    });

    it('deve usar role member por padrão', () => {
      const result = User.create(validProps);

      expect(result.getValue().role).toBe('member');
    });

    it('deve aceitar role admin', () => {
      const result = User.create({ ...validProps, role: 'admin' });

      expect(result.getValue().role).toBe('admin');
    });

  });

});