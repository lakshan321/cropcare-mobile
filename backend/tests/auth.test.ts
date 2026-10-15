import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { seedDatabase } from '../src/seed/seed';
import { User } from '../src/models/User';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Authentication & Role Protection Tests', () => {
  it('should authenticate a farmer on the shared login endpoint and return farmer role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'farmer_kamal',
        password: 'Farmer123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('farmer');
    expect(res.body.user.username).toBe('farmer_kamal');
  });

  it('should authenticate an officer on the SAME shared login endpoint and return officer role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'officer_perera',
        password: 'Officer123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('officer');
    expect(res.body.user.username).toBe('officer_perera');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'farmer_kamal',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should create farmer account and ignore any role supplied in public registration', async () => {
    const testUsername = `farmer_new_${Date.now()}`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUsername,
        password: 'SecurePassword123!',
        fullName: 'New Registered Farmer',
        role: 'officer', // Malicious attempt to self-promote to officer
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('farmer'); // MUST be farmer

    // Verify in database directly
    const createdUser = await User.findOne({ username: testUsername });
    expect(createdUser?.role).toBe('farmer');
  });

  it('should retrieve current authenticated user via /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'farmer_kamal',
        password: 'Farmer123!',
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe('farmer_kamal');
    expect(meRes.body.user.role).toBe('farmer');
  });

  it('should reject unauthenticated requests to protected routes', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
