import request from 'supertest';
import { app } from '../../../app';
import { UserModel } from '../../../infra/mongoose/models/UserModel';
import { connectMongo } from '../../../infra/mongoose/conn';
import mongoose from 'mongoose';

beforeAll(async () => {
  await connectMongo(process.env.MONGO_URI_TEST!);
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  // limpa a collection após cada teste para não ter interferência
  await UserModel.deleteMany({});
});

describe('POST /api/users', () => {

  it('deve criar um usuário com dados válidos', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name:     'Alice Costa',
        email:    'alice@taskflow.io',
        password: '123456',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('alice@taskflow.io');
  });

  it('deve retornar 400 com email inválido', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name:     'Alice Costa',
        email:    'email-invalido',
        password: '123456',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('deve retornar 409 com email duplicado', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_IN_USE');
  });

  it('deve retornar 400 com senha menor que 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

describe('POST /api/auth/login', () => {

  beforeEach(async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });
  });

  it('deve retornar token com credenciais válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@taskflow.io', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('deve retornar 401 com senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@taskflow.io', password: 'senha_errada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('deve retornar 401 com usuário inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@taskflow.io', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

});

describe('GET /api/users/me', () => {

  let token: string;

  beforeEach(async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@taskflow.io', password: '123456' });

    token = res.body.data.token;
  });

  it('deve retornar os dados do usuário logado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('alice@taskflow.io');
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app)
      .get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_MISSING');
  });

  it('deve retornar 401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token_invalido');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_INVALID');
  });

});